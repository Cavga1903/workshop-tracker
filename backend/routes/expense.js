const express = require('express');
const router = express.Router();
const supabase = require('../supabase/client');

// POST /api/expense - Create a new expense record
router.post('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .insert([req.body])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/expense - Get all expenses
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/expense/:id - Get expense by ID
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// PUT /api/expense/:id - Update expense by ID
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/expense/:id - Delete expense by ID
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router; 