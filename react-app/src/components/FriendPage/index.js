import React, { useEffect, useState } from 'react';
import { useParams } from "react-router";
import { Redirect } from 'react-router-dom';
import { useSelector, useDispatch } from "react-redux";
import * as friendActions from '../../store/friend';
import * as expenseActions from '../../store/expense';
import * as paymentActions from '../../store/payment';
import LeftNavigationBar from "../LeftNavigationBar";
import receipt from "./receipt.jpeg";
import dollar from "./dollar.jpeg";
import checkmark from "./checkmark.png";
import './FriendPage.css';
import TopNavigationBar from '../TopNavigationBar';


function FriendPage() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const sessionUser = useSelector((state) => state.session.user);
    const friend = useSelector(state => state.friend.selectedFriendship);
    const userExpenses = useSelector(state => {
        let settledExpenses = Object.values(state.expense.createdExpenses).filter(expense => {
            const friendOnly = expense.participants.filter(participant => participant.friendship_id == id && participant.is_settled);
            return friendOnly.length > 0;
        });
        let unsettledExpenses = Object.values(state.expense.createdExpenses).filter(expense => {
            const friendOnly = expense.participants.filter(participant => participant.friendship_id == id && !participant.is_settled);
            return friendOnly.length > 0;
        });
        return {
            settled: settledExpenses,
            unsettled: unsettledExpenses
        };
    });
    const unsettledExpenses = useSelector(state => {
        let expenses = Object.values(state.expense.unsettledExpenses).filter(expense => {
            return expense.friendship.user_id == friend.friend_id;
        });
        return expenses;
    });
    const settledExpenses = useSelector(state => {
        let expenses = Object.values(state.expense.settledExpenses).filter(expense => {
            return expense.friendship.user_id == friend.friend_id;
        });
        return expenses;
    });
    const sentPayments = useSelector(state => {
        let payments = Object.values(state.payment.sentPayments).filter(payment => {
            return payment.friendship_id == id;
        });
        return payments;
    });
    const receivedPayments = useSelector(state => {
        let payments = Object.values(state.payment.receivedPayments).filter(payment => {
            return payment.friendship.user_id == friend.friend_id;
        });
        return payments;
    })

    const [isFriendLoaded, setIsFriendLoaded] = useState(false);
    const [isUserExpensesLoaded, setIsUserExpensesLoaded] = useState(false);
    const [isUnsettledExpensesLoaded, setIsUnsettledExpensesLoaded] = useState(false);
    const [isSettledExpensesLoaded, setIsSettledExpensesLoaded] = useState(false);
    const [isSentPaymentsLoaded, setIsSentPaymentsLoaded] = useState(false);
    const [isReceivedPaymentsLoaded, setIsReceivedPaymentsLoaded] = useState(false);
    const [settledItems, setSettledItems] = useState([]);
    const [unsettledItems, setUnsettledItems] = useState([]);

    useEffect(() => {
        async function fetchData() {
            await dispatch(friendActions.fetchFriendshipById(id))
                .then(() => setIsFriendLoaded(true));
            await dispatch(expenseActions.getCreatedExpenses())
                .then(() => setIsUserExpensesLoaded(true));
            await dispatch(expenseActions.getUnsettledExpenses())
                .then(() => setIsUnsettledExpensesLoaded(true));
            await dispatch(expenseActions.getSettledExpenses())
                .then(() => setIsSettledExpensesLoaded(true));
            await dispatch(paymentActions.fetchSentPayments())
                .then(() => setIsSentPaymentsLoaded(true));
            await dispatch(paymentActions.fetchReceivedPayments())
                .then(() => setIsReceivedPaymentsLoaded(true));
        }
        fetchData();

        return () => {
            document.getElementById("settled-items")?.classList.add("hidden");
            document.getElementById("show-container")?.classList.remove("hidden");
        }
    }, [dispatch, id]);

    useEffect(() => {
        if (isFriendLoaded && isUserExpensesLoaded && isSettledExpensesLoaded && isUnsettledExpensesLoaded && isSentPaymentsLoaded && isReceivedPaymentsLoaded) {
            const userUnsettledExpenses = userExpenses.unsettled.map(expenseObj => {
                return { ...expenseObj, type: 'created' };
            });
            const friendUnsettledExpenses = unsettledExpenses.map(expenseObj => {
                return { ...expenseObj, type: 'charged' };
            });

            setUnsettledItems([...userUnsettledExpenses, ...friendUnsettledExpenses].sort((e1, e2) => {
                return new Date(e2.created_at).getTime() - new Date(e1.created_at).getTime()
            }));

            const userSettledExpenses = userExpenses.settled.map(expenseObj => {
                return { ...expenseObj, type: 'created' };
            });
            const friendSettledExpenses = settledExpenses.map(expenseObj => {
                return { ...expenseObj, type: 'charged' };
            });
            const userSentPayments = sentPayments.map(paymentObj => {
                return { ...paymentObj, type: 'sent' };
            });
            const userReceivedPayments = receivedPayments.map(paymentObj => {
                return { ...paymentObj, type: 'received' };
            });

            setSettledItems([...userSettledExpenses, ...friendSettledExpenses, ...userSentPayments, ...userReceivedPayments].sort((e1, e2) => {
                return new Date(e2.created_at).getTime() - new Date(e1.created_at).getTime()
            }));
        }
    }, [isFriendLoaded, isUserExpensesLoaded, isSettledExpensesLoaded, isUnsettledExpensesLoaded, isSentPaymentsLoaded, isReceivedPaymentsLoaded, receivedPayments, sentPayments, settledExpenses, unsettledExpenses, userExpenses.settled, userExpenses.unsettled]);

    function formatMoney(amount) {
        return "$" + String(Number(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'));
    };

    function deleteExpense(expenseId, settled, type) {
        let answer = window.confirm("Are you sure you want to delete this expense? This will completely remove this expense for ALL people involved, not just you.");
        if (answer) {
            dispatch(expenseActions.deleteExpense(expenseId));
            if (settled) {
                if (type === 'created') {
                    setSettledItems(settledItems.filter(obj => {
                        return !(!obj.expense && obj.id == expenseId);
                    }));
                } else if (type === 'charged') {
                    setSettledItems(settledItems.filter(obj => {
                        return !(obj.expense.id == expenseId);
                    }));
                }
            } else {
                if (type === 'created') {
                    setUnsettledItems(unsettledItems.filter(obj => {
                        return !(!obj.expense && obj.id == expenseId)
                    }));
                } else if (type === 'charged') {
                    setUnsettledItems(unsettledItems.filter(obj => {
                        return !(obj.expense.id == expenseId);
                    }));
                }
            }
        }
    };

    function deletePayment(paymentId) {
        let answer = window.confirm("Are you sure you want to delete this payment?");
        if (answer) {
            dispatch(paymentActions.fetchDeletePayment(paymentId))
            setSettledItems(settledItems.filter(obj => {
                return !((obj.type === 'sent' || obj.type === 'received') && obj.id == paymentId)
            }));
        }
    };

    if (!sessionUser) return <Redirect to="/" />;

    return (isFriendLoaded &&
        <>
            <LeftNavigationBar />
            <TopNavigationBar />
            <div id="friend-expenses">
                <div id="unsettled-items">
                {unsettledItems.map(obj => {
                    const dateStr = new Date(obj.created_at).toDateString();
                    const dateMonth = `${dateStr.split(" ")[1].toUpperCase()}`;
                    const dateDay = `${dateStr.split(" ")[2]}`;
                    switch (obj.type) {
                        case 'created':
                            return (
                                <div className="expense-header">
                                    <div className="expense-header-date">
                                        <p className="expense-header-month">{dateMonth}</p>
                                        <p className="expense-header-day">{dateDay}</p>
                                    </div>
                                    <img className="expense-header-logo" src={receipt} alt="receipt-logo"></img>
                                    <div className="expense-header-description">
                                        {obj.description}
                                    </div>
                                    <div className="expense-header-A">
                                        <p>you paid</p>
                                        <p>{formatMoney(obj.amount)}</p>
                                    </div>
                                    <div className="expense-header-B teal-amount">
                                        <p>you lent {friend.friend.short_name}</p>
                                        <p>{formatMoney(obj.participants[0].amount_due)}</p>
                                    </div>
                                    <button className="delete-expense" onClick={() => deleteExpense(obj.id, false, obj.type)}>
                                        &#x2715;
                                    </button>
                                </div>
                            );
                        case 'charged':
                            return (
                                <div className="expense-header">
                                    <div className="expense-header-date">
                                        <p className="expense-header-month">{dateMonth}</p>
                                        <p className="expense-header-day">{dateDay}</p>
                                    </div>
                                    <img className="expense-header-logo" src={receipt} alt="receipt-logo"></img>
                                    <div className="expense-header-description">
                                        {obj.expense.description}
                                    </div>
                                    <div className="expense-header-A">
                                        <p>{friend.friend.short_name} paid</p>
                                        <p>{formatMoney(obj.expense.amount)}</p>
                                    </div>
                                    <div className="expense-header-B orange-amount">
                                        <p>{friend.friend.short_name} lent you</p>
                                        <p>{formatMoney(obj.amount_due)}</p>
                                    </div>
                                    <button className="delete-expense" onClick={() => deleteExpense(obj.expense.id, false, obj.type)}>
                                        &#x2715;
                                    </button>
                                </div>
                            );
                        default:
                            return <></>;
                    }
                })}
            </div>
            <div id="show-container">
                {unsettledItems.length === 0 &&
                    <>
                        <img id="settled-up-logo" src={checkmark} alt="checkmark-logo"></img>
                        <div id="show-button-description">You and {friend.friend.name} are all settled up.</div>
                    </>
                }
                {unsettledItems.length > 0 &&
                    <div id="show-button-description">All expenses before this date have been settled up.</div>
                }
                <button id="show-button" onClick={() => {
                    document.getElementById("settled-items").classList.remove("hidden");
                    document.getElementById("show-container").classList.add("hidden");
                    // document.getElementById("settled-up-logo")?.classList.add("hidden");
                    // document.getElementById("show-button-description").classList.add("hidden");
                }}>
                    Show settled expenses
                </button>
            </div>
            <div id="settled-items" className="hidden">
                {settledItems.map(obj => {
                    const dateStr = new Date(obj.created_at).toDateString();
                    const dateMonth = `${dateStr.split(" ")[1].toUpperCase()}`;
                    const dateDay = `${dateStr.split(" ")[2]}`;
                    switch (obj.type) {
                        case 'created':
                            return (
                                <div className="expense-header">
                                    <div className="expense-header-date">
                                        <p className="expense-header-month">{dateMonth}</p>
                                        <p className="expense-header-day">{dateDay}</p>
                                    </div>
                                    <img className="expense-header-logo" src={receipt} alt="receipt-logo"></img>
                                    <div className="expense-header-description">
                                        {obj.description}
                                    </div>
                                    <div className="expense-header-A">
                                        <p>you paid</p>
                                        <p>{formatMoney(obj.amount)}</p>
                                    </div>
                                    <div className="expense-header-B teal-amount">
                                        <p>you lent {friend.friend.short_name}</p>
                                        <p>{formatMoney(obj.participants[0].amount_due)}</p>
                                    </div>
                                    <button className="delete-expense" onClick={() => deleteExpense(obj.id, true, obj.type)}>
                                        &#x2715;
                                    </button>
                                </div>
                            );
                        case 'charged':
                            return (
                                <div className="expense-header">
                                    <div className="expense-header-date">
                                        <p className="expense-header-month">{dateMonth}</p>
                                        <p className="expense-header-day">{dateDay}</p>
                                    </div>
                                    <img className="expense-header-logo" src={receipt} alt="receipt-logo"></img>
                                    <div className="expense-header-description">
                                        {obj.expense.description}
                                    </div>
                                    <div className="expense-header-A">
                                        <p>{friend.friend.short_name} paid</p>
                                        <p>{formatMoney(obj.expense.amount)}</p>
                                    </div>
                                    <div className="expense-header-B orange-amount">
                                        <p>{friend.friend.short_name} lent you</p>
                                        <p>{formatMoney(obj.amount_due)}</p>
                                    </div>
                                    <button className="delete-expense" onClick={() => deleteExpense(obj.expense.id, true, obj.type)}>
                                        &#x2715;
                                    </button>
                                </div>
                            );
                        case 'sent':
                            return (
                                <div className="payment-header">
                                    <img className="payment-header-logo" src={dollar} alt="dollar-logo"></img>
                                    <div className="payment-header-description">
                                        {sessionUser.short_name} paid {friend.friend.short_name} {formatMoney(obj.amount)}
                                    </div>
                                    <div className="payment-header-A">
                                        you paid
                                    </div>
                                    <div className="payment-header-B teal-amount">
                                        {formatMoney(obj.amount)}
                                    </div>
                                    <button className="delete-payment" onClick={() => deletePayment(obj.id)}>
                                        &#x2715;
                                    </button>
                                </div>
                            );
                        case 'received':
                            return (
                                <div className="payment-header">
                                    <img className="payment-header-logo" src={dollar} alt="dollar-logo"></img>
                                    <div className="payment-header-description">
                                        {friend.friend.short_name} paid {sessionUser.short_name} {formatMoney(obj.amount)}
                                    </div>
                                    <div className="payment-header-A">
                                        you received
                                    </div>
                                    <div className="payment-header-B orange-amount">
                                        {formatMoney(obj.amount)}
                                    </div>
                                    <button className="delete-payment" onClick={() => deletePayment(obj.id)}>
                                        &#x2715;
                                    </button>
                                </div>
                            );
                        default:
                            return <></>;
                    }
                })}
            </div>
            </div>

        </>
    );
}

export default FriendPage;
