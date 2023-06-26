from flask import Blueprint, jsonify, session, request
from flask_login import current_user, login_required
from app.models import db, Payment, Friendship, ExpenseParticipant
from app.forms import PaymentForm
from app.api.auth_routes import validation_errors_to_error_messages

payment_routes = Blueprint('payments', __name__)


def format_amount(amount):
    """
    Format the amount as a dollar amount
    """
    return "${:.2f}".format(amount)


@payment_routes.route('/', methods=['POST'])
@login_required
def create_payment():
    """
    Creates a new payment
    """

    # data = request.json
    # amount = data.get('amount')
    # friendship_id = data.get('friendship_id')  # Fetch the friendship_id from the request data
    # if not amount:
    #     return {'errors': ['Amount is required.']}, 400
    # payment = Payment(amount=amount, friendship_id=friendship_id)  # Use the fetched friendship_id
    # db.session.add(payment)
    # db.session.commit()
    # # Return a dictionary representation of the payment object with formatted amount
    # return jsonify({
    #     'id': payment.id,
    #     'friendship_id': payment.friendship_id,
    #     'amount': format_amount(payment.amount),
    #     'created_at': payment.created_at.isoformat(),
    #     'updated_at': payment.updated_at.isoformat()
    # }), 201

    form = PaymentForm()
    form['csrf_token'].data = request.cookies['csrf_token']
    # set form's SelectField choices to active friends of current user with positive bill amounts
    form.friendship.choices = [(friendship.id, friendship.friend.to_dict()['name']) for friendship in Friendship.query.filter(Friendship.user_id == current_user.id, Friendship.is_active == True, Friendship.bill >= 0).all()]
    if form.validate_on_submit():
        payment = Payment(
            amount=form.data['amount'],
            friendship_id=form.data['friendship']
        )
        db.session.add(payment)
        db.session.commit()
        user_to_friend = Friendship.query.get(payment.friendship_id)
        friend_to_user = Friendship.query.filter(Friendship.user_id == user_to_friend.friend_id, Friendship.friend_id == user_to_friend.user_id).first()
        # "settling up": update both friendships' bill amounts to 0
        user_to_friend.bill = 0
        friend_to_user.bill = 0
        # "settling up": update both friendships' expenses to settled
        expenses = ExpenseParticipant.query.filter(ExpenseParticipant.friendship_id.in_([user_to_friend.id, friend_to_user.id])).all()
        for expense in expenses:
            expense.is_settled = True
        db.session.commit()
        return payment.to_dict(), 201
    return {'errors': validation_errors_to_error_messages(form.errors)}, 400


@payment_routes.route('/sent', methods=['GET'])
@login_required
def sent_payments():
    """
    Query for all payments sent by the current user and returns them in a list of payment dictionaries
    """
    friendships = Friendship.query.filter(Friendship.user_id == current_user.id).all()
    friendship_ids = [friendship.id for friendship in friendships]
    sent_payments = Payment.query.filter(Payment.friendship_id.in_(friendship_ids)).all()
    return {'sent': [payment.to_dict() for payment in sent_payments]}
    # payments_list = []
    # for payment in payments:
    #     payments_list.append({
    #         'id': payment.id,
    #         'friendship_id': payment.friendship_id,
    #         'amount': format_amount(payment.amount),  # Format amount as a dollar amount
    #         'created_at': payment.created_at.isoformat(),
    #         'updated_at': payment.updated_at.isoformat()
    #     })
    # return jsonify(payments_list)


@payment_routes.route('/received', methods=['GET'])
@login_required
def received_payments():
    """
    Query for all payments received by the current user and returns them in a list of payment dictionaries
    """
    friendships = Friendship.query.filter(Friendship.friend_id == current_user.id).all()
    friendship_ids = [friendship.id for friendship in friendships]
    received_payments = Payment.query.filter(Payment.friendship_id.in_(friendship_ids)).all()
    return {'received': [payment.to_dict() for payment in received_payments]}


@payment_routes.route('/<int:id>', methods=['DELETE'])
@login_required
def delete_payment(id):
    """
    Deletes a payment
    """
    payment = Payment.query.get(id)
    # checks if payment exists
    if not payment:
        return {'errors': f"Payment {id} does not exist."}, 400
    # checks if current user is a creator of the payment
    if payment.friendship.user_id != current_user.id:
        return {'errors': f"User is not the creator of payment {id}."}, 401
    db.session.delete(payment)
    db.session.commit()
    return {'message': 'Delete successful.'}