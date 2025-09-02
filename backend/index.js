const express = require('express');
const app = express();
const port = 3000;
const fs = require('fs/promises');
const path = require('path');

app.use(express.json());
//получить все таски
app.get('/api/todos', async (req, res) => {
  try {
    const data = await fs.readFile(path.join(__dirname, 'db.json'), 'utf-8'); //читаем содержимое файла
    const db = JSON.parse(data || '{"todos": []}'); //парсим содержимое
    res.json(db.todos);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});
//добавить новую таску
app.post('/api/todos', async (req, res) => {
  try {
    const data = await fs.readFile(path.join(__dirname, 'db.json'), 'utf-8');
    const db = JSON.parse(data || '{"todos": []}');
    const newTodo = req.body; //получаем новую таску из тела запроса
    db.todos.push(newTodo); //добавляем в массив задач
    await fs.writeFile(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2)); //сохраняем новую версию дб после добавления таски и делаем красивый текст формата JSON
    res.status(201).json(newTodo);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});
//редактирование
app.patch('/api/todos/:id', async (req, res) => {
  try {
    const data = await fs.readFile(path.join(__dirname, 'db.json'), 'utf-8');
    const db = JSON.parse(data || '{"todos": []}');
    const todoId = Number(req.params.id); //получаем айдишку таски из юрл запроса и проверяем что это число
    if (Number.isNaN(todoId)) {
      return res.status(400).json({ message: 'Invalid Id' });
    }

    const update = req.body;
    const indx = db.todos.findIndex((todo) => todo.id == todoId); //ищем индекс нужной таски
    if (indx === -1) {
      return res.status(404).json({ message: 'Task not found' });
    }

    db.todos[indx] = { ...db.todos[indx], ...update };

    await fs.writeFile(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
    res.status(200).json(db.todos[indx]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});
//удаление
app.delete('/api/todos/:id', async (req, res) => {
  try {
    const data = await fs.readFile(path.join(__dirname, 'db.json'), 'utf-8');
    const db = JSON.parse(data || { todos: [] });
    const todoId = Number(req.params.id);
    if (Number.isNaN(todoId)) {
      return res.status(400).json({ message: 'Invalid Id' });
    }
    const deletedTodo = db.todos.filter((todo) => todo.id !== todoId); //фильтруем массив и удаляем таску с этим айди
    db.todos = deletedTodo;
    await fs.writeFile(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
    res.status(200).json({ message: 'Task successfully deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.listen(port, () => {
  console.log(`Server started on ${port}`);
});
