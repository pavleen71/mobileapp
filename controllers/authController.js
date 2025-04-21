const sql = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register Controller
exports.registerUser = async (req, res) => {
  const { name, email, password, DOB } = req.body;

  try {
    const pool = await sql.connect();

    // Check if user already exists
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Users WHERE email = @email');

    if (result.recordset.length > 0) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    await pool.request()
      .input('name', sql.VarChar, name)
      .input('email', sql.VarChar, email)
      .input('password', sql.VarChar, hashedPassword)
      .input('DOB', sql.Date, DOB)
      .query(`
        INSERT INTO Users (name, email, password, DOB)
        VALUES (@name, @email, @password, @DOB)
      `);

    res.status(201).json({ msg: 'User registered successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Login Controller
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const pool = await sql.connect();

    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Users WHERE email = @email');

    const user = result.recordset[0];

    if (!user) {
      return res.status(400).json({ msg: 'User does not exist' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        DOB: user.DOB,
        created_at: user.created_at
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
};


// Create Transaction
exports.createTransaction = async (req, res) => {
    const { user_id, category_id, amount, date, description, type } = req.body;

    try {
        const pool = await sql.connect();

        // Insert new transaction
        await pool.request()
            .input('user_id', sql.Int, user_id)
            .input('category_id', sql.Int, category_id)
            .input('amount', sql.Decimal(10, 2), amount)
            .input('date', sql.Date, date)
            .input('description', sql.Text, description)
            .input('type', sql.VarChar, type)
            .query(`
                INSERT INTO Transactions (user_id, category_id, amount, date, description, type)
                VALUES (@user_id, @category_id, @amount, @date, @description, @type)
            `);

        res.status(201).json({ msg: 'Transaction added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add transaction' });
    }
};
// Create Category
exports.createCategory = async (req, res) => {
  const { name, type } = req.body;

  try {
      const pool = await sql.connect();

      // Insert new category
      await pool.request()
          .input('name', sql.VarChar, name)
          .input('type', sql.VarChar, type)
          .query(`
              INSERT INTO Categories (name, type)
              VALUES (@name, @type)
          `);

      res.status(201).json({ msg: 'Category created successfully' });
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create category' });
  }
};
// Set or Update Budget
exports.setBudget = async (req, res) => {
  const { user_id, start_date, amount, end_date } = req.body;

  try {
      const pool = await sql.connect();

      // Check if a budget already exists for the user in the given date range
      const result = await pool.request()
          .input('user_id', sql.Int, user_id)
          .input('start_date', sql.Date, start_date)
          .input('end_date', sql.Date, end_date)
          .query(`
              SELECT * FROM Budget 
              WHERE user_id = @user_id AND start_date = @start_date AND end_date = @end_date
          `);

      // If no budget exists, create a new one
      if (result.recordset.length === 0) {
          await pool.request()
              .input('user_id', sql.Int, user_id)
              .input('start_date', sql.Date, start_date)
              .input('amount', sql.Decimal(10, 2), amount)
              .input('end_date', sql.Date, end_date)
              .query(`
                  INSERT INTO Budget (user_id, start_date, amount, end_date)
                  VALUES (@user_id, @start_date, @amount, @end_date)
              `);

          res.status(201).json({ msg: 'Budget set successfully' });
      } else {
          // If the budget exists, update it
          await pool.request()
              .input('user_id', sql.Int, user_id)
              .input('amount', sql.Decimal(10, 2), amount)
              .input('start_date', sql.Date, start_date)
              .input('end_date', sql.Date, end_date)
              .query(`
                  UPDATE Budget 
                  SET amount = @amount 
                  WHERE user_id = @user_id AND start_date = @start_date AND end_date = @end_date
              `);

          res.status(200).json({ msg: 'Budget updated successfully' });
      }
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to set budget' });
  }
};
// Get User's Transactions
exports.getTransactions = async (req, res) => {
  const { user_id, start_date, end_date } = req.query;

  try {
      const pool = await sql.connect();

      let query = `
          SELECT t.transaction_id, t.amount, t.date, t.description, t.type, c.name as category
          FROM Transactions t
          INNER JOIN Categories c ON t.category_id = c.categories_id
          WHERE t.user_id = @user_id
      `;

      if (start_date && end_date) {
          query += ` AND t.date BETWEEN @start_date AND @end_date`;
      }

      const result = await pool.request()
          .input('user_id', sql.Int, user_id)
          .input('start_date', sql.Date, start_date)
          .input('end_date', sql.Date, end_date)
          .query(query);

      res.status(200).json(result.recordset);
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};
// Get User's Budget
exports.getBudget = async (req, res) => {
  const { user_id } = req.query;

  try {
      const pool = await sql.connect();

      const result = await pool.request()
          .input('user_id', sql.Int, user_id)
          .query(`
              SELECT * FROM Budget 
              WHERE user_id = @user_id
          `);

      res.status(200).json(result.recordset);
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch budget information' });
  }
};
// Edit Transaction
exports.editTransaction = async (req, res) => {
  const { transaction_id, amount, description, date, category_id } = req.body;

  try {
      const pool = await sql.connect();

      // Update transaction details
      await pool.request()
          .input('transaction_id', sql.Int, transaction_id)
          .input('amount', sql.Decimal(10, 2), amount)
          .input('description', sql.Text, description)
          .input('date', sql.Date, date)
          .input('category_id', sql.Int, category_id)
          .query(`
              UPDATE Transactions
              SET amount = @amount, description = @description, date = @date, category_id = @category_id
              WHERE transaction_id = @transaction_id
          `);

      res.status(200).json({ msg: 'Transaction updated successfully' });
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update transaction' });
  }
};
// Delete Transaction
exports.deleteTransaction = async (req, res) => {
  const { transaction_id } = req.params;

  try {
      const pool = await sql.connect();

      // Delete the transaction
      await pool.request()
          .input('transaction_id', sql.Int, transaction_id)
          .query(`
              DELETE FROM Transactions WHERE transaction_id = @transaction_id
          `);

      res.status(200).json({ msg: 'Transaction deleted successfully' });
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete transaction' });
  }
};

