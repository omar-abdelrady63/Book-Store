from flask import Blueprint, render_template, redirect, url_for, request, session, flash
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Book

main = Blueprint('main', __name__)

@main.route('/')
def home():
    return redirect(url_for('main.login'))

@main.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password, password):
            session['user_id'] = user.id
            return redirect(url_for('main.dashboard'))
        else:
            flash('Invalid username or password', 'danger')
    return render_template('login.html')


#_________________________________________________________________________________

@main.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        hashed_password = generate_password_hash(password)
        
        # Check if user exists
        if User.query.filter_by(username=username).first():
            flash('Username already exists', 'warning')
            return redirect(url_for('main.signup'))
            
        new_user = User(username=username, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()
        return redirect(url_for('main.login'))
    return render_template('signup.html')


#_________________________________________________________________________________


@main.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('main.login'))
    
    search_query = request.args.get('search')
    category_filter = request.args.get('category')
    
    query = Book.query
    
    if search_query:
        query = query.filter(Book.title.contains(search_query))
    
    if category_filter and category_filter != 'All':
        query = query.filter_by(category=category_filter)
        
    books = query.all()
    
    cart = session.get('cart', {})
    cart_count = sum(cart.values())
    
    return render_template('dashboard.html', books=books, cart_count=cart_count)



#_________________________________________________________________________________


@main.route('/add_to_cart/<int:book_id>')
def add_to_cart(book_id):
    if 'user_id' not in session:
        return redirect(url_for('main.login'))
    
    book = Book.query.get_or_404(book_id)

    if book.stock <= 0:
        flash('This book is out of stock!', 'warning')
        return redirect(url_for('main.dashboard'))

    cart = session.get('cart', {})
    book_id_str = str(book_id)
    
    if book_id_str in cart:
         return redirect(url_for('main.dashboard'))
    
    cart[book_id_str] = 1
    session['cart'] = cart
    return redirect(url_for('main.dashboard'))
#_________________________________________________________________________________


@main.route('/cart')
def cart():
    if 'user_id' not in session:
        return redirect(url_for('main.login'))
    
    cart = session.get('cart', {})
    cart_items = []
    total_price = 0
    
    if cart:
        book_ids = [int(bid) for bid in cart.keys()]
        books = Book.query.filter(Book.id.in_(book_ids)).all()
        
        for book in books:
            qty = cart.get(str(book.id), 0)
            subtotal = book.price * qty
            total_price += subtotal
            cart_items.append({
                'book': book,
                'quantity': qty,
                'subtotal': subtotal
            })
            
    return render_template('cart.html', cart_items=cart_items, total_price=total_price)

@main.route('/update_quantity/<int:book_id>', methods=['POST'])
def update_quantity(book_id):
    if 'user_id' not in session:
        return redirect(url_for('main.login'))
    
    cart = session.get('cart', {})
    book_id_str = str(book_id)
    
    if book_id_str in cart:
        try:
            new_qty = int(request.form.get('quantity', 1))
            if new_qty < 1:
                new_qty = 1
            cart[book_id_str] = new_qty
            session['cart'] = cart
        except ValueError:
            pass
            
    return redirect(url_for('main.cart'))

@main.route('/remove_from_cart/<int:book_id>')
def remove_from_cart(book_id):
    if 'user_id' not in session:
        return redirect(url_for('main.login'))
    
    cart = session.get('cart', {})
    book_id_str = str(book_id)
    
    if book_id_str in cart:
        del cart[book_id_str]
        session['cart'] = cart
        
    return redirect(url_for('main.cart'))

@main.route('/logout')
def logout():
    session.pop('user_id', None)
    session.pop('cart', None)
    return redirect(url_for('main.login'))
