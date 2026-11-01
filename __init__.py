from flask import Flask
from models import db, Book

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'tokyo-lights-secret-key'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    from routes import main
    app.register_blueprint(main)

    with app.app_context():
        db.create_all()
        seed_data()

    return app

def seed_data():
    if not Book.query.first():
        books = [
            Book(title="the first book", author="me", category="Science", price=15.99, stock=10),
            Book(title="sec one", author="also me", category="History", price=18.50, stock=5),
            Book(title="3rd", author="it's just me bro", category="Novel", price=12.00, stock=8),
            Book(title="the number 4", author="lol", category="Science", price=14.99, stock=7),
            Book(title="blood", author="good", category="History", price=16.75, stock=6),
            Book(title="The Great alexander", author="idk tbh", category="Novel", price=10.99, stock=9)
        ]
        db.session.bulk_save_objects(books)
        db.session.commit()
        print("Dummy books inserted with prices.")
