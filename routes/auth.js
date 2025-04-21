const express = require('express');
const router = express.Router();
const { registerUser, loginUser, createTransaction,createCategory,setBudget,getTransactions,getBudget,editTransaction,deleteTransaction} = require('../controllers/authController');

// Register
router.post('/register', registerUser);

// Login
router.post('/login', loginUser);
router.post('/transaction', createTransaction);
router.post('/category', createCategory);
router.post('/budget', setBudget);
router.get('/transactions', getTransactions);
router.get('/budget', getBudget);
// Route to edit a transaction
router.put('/transactions/:transaction_id', editTransaction);

// Route to delete a transaction
router.delete('/transactions/:transaction_id',deleteTransaction);

module.exports = router;
