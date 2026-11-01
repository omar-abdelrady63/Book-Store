# Book Store Web Application

A lightweight web application for an online bookstore built with Python and Flask.

## Features

- **User Authentication**: Secure user registration and login system.
- **Book Catalog**: Browse available books categorized by genre with pricing and stock info.
- **Shopping Cart**: Add books to the cart and manage selections.
- **Database**: SQLite database powered by Flask-SQLAlchemy with automatic sample data seeding.

## Tech Stack

- **Backend**: Python, Flask, Flask-SQLAlchemy
- **Frontend**: HTML5, CSS3, JavaScript, Jinja2 Templates
- **Database**: SQLite

## Getting Started

### Prerequisites

- Python 3.8+ installed on your machine.

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/omar-abdelrady63/Book-Store.git
   cd Book-Store
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install flask flask-sqlalchemy
   ```

4. **Run the application:**
   ```bash
   python app.py
   ```
   Or run `run_flask.bat` on Windows.

5. Open your browser and navigate to `http://127.0.0.1:5000`.
