import LeftNavigationBar from "../LeftNavigationBar";
import { NavLink, Redirect } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { getSummary } from "../../store/expense";
import { fetchFriendships } from "../../store/friend";
import TopNavigationBar from "../TopNavigationBar";
import MainHeader from "../MainHeader";
import "./DashboardPage.css";

function DashboardPage() {
  const dispatch = useDispatch();
  const sessionUser = useSelector((state) => state.session.user);
  const summary = useSelector((state) => state.expense.summary);
  const friend = useSelector((state) => state.friend);
  const friendship = Object.values(friend.friendships);
  const youOwe = friendship.filter((item) => item.bill > 0);
  const youAreOwed = friendship.filter((item) => item.bill < 0);
  useEffect(() => {
    dispatch(getSummary());
    dispatch(fetchFriendships());
  }, [dispatch]);

  if (!sessionUser) return <Redirect to="/" />;

  return (
    <>
      <LeftNavigationBar />
      <TopNavigationBar />
      {/* <MainHeader /> */}
      <main className="main">

        <section className="subheader">
          <ul className="subheader-list">
            <li>
              <p className="subheader-list-text">total balance: </p>
              {summary["you owe"] > summary["you are owed"] ? (
                <p className={`subheader-text subheader-text-orange`}>
                  - ${+summary.balance}.00
                </p>
              ) : (
                <p className={`subheader-text subheader-text-green`}>
                  + ${+summary.balance}.00
                </p>
              )}
            </li>
            <li className="subheader-item">
              <p className="subheader-list-text">you owe: </p>

              <p className={`subheader-text subheader-text-orange`}>
                ${+summary["you owe"]}.00
              </p>
            </li>
            <li>
              <p className="subheader-list-text">you are owed: </p>

              <p className={`subheader-text subheader-text-green`}>
                ${+summary["you are owed"]}.00
              </p>
            </li>
          </ul>
        </section>

        <section className="owed-section">
          <div className="owed-wrapper">
            <h4 className="owed-title">YOU OWE</h4>
            {youAreOwed.length ? (
              <ul className="owed-list">
                {youAreOwed.map((item) => (
                  <li className="owed-item" key={item.id}>
                    <NavLink to={`/friend/${item.friend_id}`}>

                      <img src={item.friend.image_url} alt={item.friend.name} />
                      <div>
                        <p>{item.friend.name}</p>
                        <p className="subheader-text-orange">
                          ${+item.bill}.00
                        </p>
                      </div>
                    </NavLink>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-owe">You don't owe anything</p>
            )}
          </div>
          <div className="owed-wrapper owed-wrapper-right">
            <h4 className="owed-title owed-title-right ">YOU ARE OWED</h4>
            {youOwe.length && (
              <ul className="owed-list">
                {youOwe.map((item) => (
                  <li className="owed-item" key={item.id}>
                    <NavLink to={`/friend/${item.friend_id}`}>
                    {console.log(item.friend.image_url, 33333333333)}
                      <img src={item.friend.image_url} alt={item.friend.name} />
                      <div>
                        <p>{item.friend.name}</p>
                        <p className="subheader-text-green">${+item.bill}.00</p>
                      </div>
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
            {!youOwe.length && (
              <p className="no-owe">You are not owed anything</p>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

export default DashboardPage;
