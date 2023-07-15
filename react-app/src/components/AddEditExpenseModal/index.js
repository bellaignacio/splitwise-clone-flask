import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useModal } from '../../context/Modal';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import { getCreatedExpenses, createExpense, updateExpense } from '../../store/expense';
import './AddEditExpenseModal.css';

function AddEditExpenseModal({ expenseId }) {
  const { closeModal } = useModal();
  const [errors, setErrors] = useState([]);
  const dispatch = useDispatch();
  const friendships = useSelector((state) => Object.values(state.friend.friendships));
  const createdExpenses = useSelector((state) => state.expense.createdExpenses);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [showFriendList, setShowFriendList] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        const response = await fetch(`/api/expenses/${expenseId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch expense');
        }
        const data = await response.json();
        console.log('Fetched expense:', data);

        if (data.participants && Array.isArray(data.participants)) {
          setDescription(data.description);
          setAmount(data.amount);

          // Extract selected friend IDs from the fetched data
          const selectedFriendIds = data.participants.map((participant) => participant.friendship.friend_id);
          console.log('Selected friend IDs:', selectedFriendIds);

          // Find corresponding friendships for the selected friend IDs
          const selectedFriendships = friendships.filter((friendship) =>
            selectedFriendIds.includes(friendship.friend.id)
          );
          console.log('Selected friendships:', selectedFriendships);

          // Set the selected friends in the state
          setSelectedFriends(selectedFriendships.map((friendship) => friendship.friend.id));
        }
      } catch (error) {
        console.error('Error fetching expense:', error.message);
      }
    };


    if (expenseId && createdExpenses[expenseId]) {
      fetchExpense();
    }
  }, [createdExpenses, expenseId]);





  const handleFriendToggle = (friendId) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter((id) => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!description || !amount || selectedFriends.length === 0) {
      // Add validation for required fields
      setErrors({
        description: !description ? 'Description is required.' : '',
        amount: !amount ? 'Amount is required.' : '',
        selectedFriends: selectedFriends.length === 0 ? 'At least one friend must be selected.' : ''
      });
      console.log('Please fill in all required fields.');
      return;
    }


    const friendsIds = selectedFriends.map((friendId) => parseInt(friendId));

    if (expenseId) {
      dispatch(updateExpense(expenseId, description, amount, friendsIds));
    } else {
      dispatch(createExpense(description, amount, friendsIds));
    }
    closeModal();
  };

  const filteredFriends = friendships.filter((friendship) =>
    friendship.friend.name.toLowerCase().includes(searchText.toLowerCase())
  );

return (
  <form className="add-edit-expense-form" onSubmit={handleSubmit}>
    <h2>{expenseId ? 'Edit Expense' : 'Add Expense'}</h2>
    <div className="error-msg">
      <ul>
        {Object.values(errors).map((error) => (
          error && <li key={error}>{error}</li>
        ))}
      </ul>
    </div>

    <div className="friend-selection">
      <div className="selected-friends">
        {selectedFriends.map((friendId) => {
          const selectedFriendship = friendships.find((friendship) => friendship.id === friendId);
          return (
            <div key={friendId} className="selected-friend">
              {selectedFriendship && selectedFriendship.friend.name}
              <button className="remove-button" onClick={() => handleFriendToggle(friendId)}>
                Remove
              </button>
            </div>
          );
        })}
      </div>

      {!expenseId && (
        <div className="dropdown">
          <button className="dropdown-button" onClick={() => setShowFriendList(!showFriendList)}>
            {showFriendList ? 'Hide Friends' : 'Select Friends'}
          </button>
          {showFriendList && (
            <div className="friend-list">
              {filteredFriends.map((friendship) => (
                <div
                  key={friendship.id}
                  className={`friend ${selectedFriends.includes(friendship.id) ? 'selected' : ''}`}
                  onClick={() => handleFriendToggle(friendship.id)}
                >
                  {friendship.friend.name}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>

    <div className="form-group">
      <label htmlFor="description">Description</label>
      <input
        type="text"
        id="description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        disabled={expenseId} // Disable the input field if expenseId is present
      />
    </div>

    <div className="form-group">
      <label htmlFor="amount">Amount</label>
      <input
        type="number"
        id="amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />
    </div>

    <div className="expense-info">
      <div className="expense-info-row">
        <label>Paid by you and split equally:</label>
        <div>{'$' + (amount / (selectedFriends.length + 1)).toFixed(2)}/person</div>
      </div>
    </div>

    <div className="form-actions">
      <button type="button" className="cancel-button" onClick={closeModal}>
        Cancel
      </button>
      <button type="submit" className="save-button">Save</button>
    </div>
  </form>
);
}

export default AddEditExpenseModal;
