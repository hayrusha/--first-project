const API = 'http://localhost:3000/api/todos';
let todos = [];

const todoList = document.getElementById('todo-list');
const selectTodo = document.getElementById('todo-select');
const selectValue = selectTodo.value;
// const confirmationBox = document.getElementById('confirmationBox');
// const editModal = document.getElementById('editModal');

// отрисовка
function renderTodo(filterType = 'all') {
  todoList.innerHTML = '';
  let filteredTodos = todos;
  if (filterType === 'isActive') {
    filteredTodos = todos.filter((todo) => !todo.completed);
  } else if (filterType === 'completed') {
    filteredTodos = todos.filter((todo) => todo.completed);
  }

  filteredTodos.forEach((todo) => {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.completed ? 'completed' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.addEventListener('change', () => toggleTodoStatus(todo.id));

    const span = document.createElement('span');
    span.textContent = todo.title;

    const editBtn = document.createElement('button');
    editBtn.innerHTML = '🖊️';
    editBtn.addEventListener('click', () => editTodo(todo.id));
    const delBtn = document.createElement('button');
    delBtn.innerHTML = '❌';
    delBtn.addEventListener('click', () => deletedTodo(todo.id));

    const todoActions = document.createElement('div');
    todoActions.className = 'todo-actions';
    todoActions.appendChild(editBtn);
    todoActions.appendChild(delBtn);

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(todoActions);

    todoList.appendChild(li);
  });
}

// получение всех задач

async function getTodos() {
  try {
    const response = await axios.get(API);
    todos = response.data;
    localStorage.setItem('todos', JSON.stringify(todos));
    renderTodo(selectTodo.value);
  } catch (error) {
    console.error('Error get', error);
  }
}
// фильтр по статусу
async function toggleTodoStatus(todoId) {
  todos = todos.map((todo) => {
    if (todo.id === todoId) {
      return { ...todo, completed: !todo.completed };
    }
    return todo;
  });

  try {
    await axios.patch(`${API}/${todoId}`, {
      completed: todos.find((todo) => todo.id === todoId).completed,
    });
    localStorage.setItem('todos', JSON.stringify(todos));
  } catch (error) {
    console.error('Error toggle', error);
  }
  renderTodo(selectTodo.value);
}

// добавление задачи по нажатию ентер
const todoInput = document.getElementById('todo-input');

todoInput.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const title = todoInput.value.trim();
    if (!title) return;

    try {
      const newTodo = {
        id: Date.now(),
        title: title,
        completed: false,
      };
      const response = await axios.post(API, newTodo);
      todos.push(response.data);
      localStorage.setItem('todos', JSON.stringify(todos));
      todoInput.value = '';
      renderTodo(selectTodo.value);
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  }
});

// удаление
/**
 * @param {number} id
 */
async function deletedTodo(id) {
  try {
    await axios.delete(`${API}/${id}`);
    todos = todos.filter((todo) => todo.id !== id);
    localStorage.setItem('todos', JSON.stringify(todos));
    renderTodo(selectTodo.value);
  } catch (error) {
    console.error('Error delete', error);
  }
}
// редактирование
// /**
//  * @param {number} id
//  */
// async function editTodo(id) {

//   } catch (error) {
//     console.error('Error edit', error);
//   }
// }

// удаление всех туду
document.getElementById('del-all-todo-btn').addEventListener('click', async () => {
  try {
    for (const todo of todos) {
      await axios.delete(`${API}/${todo.id}`);
    }
    localStorage.clear();
    todos = [];
    renderTodo(selectTodo.value);
  } catch (error) {
    console.error('Error delete all todos', error);
  }
});

// смена темы
function updateIcons() {
  const moonIcon = document.querySelector('.moon-icon');
  const sunIcon = document.querySelector('.sun-icon');
  if (themeToggle.checked) {
    moonIcon.style.opacity = '0';
    sunIcon.style.opacity = '1';
  } else {
    moonIcon.style.opacity = '1';
    sunIcon.style.opacity = '0';
  }
}

function chosenTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    app.classList.remove('light');
    app.classList.add('dark');
    themeToggle.checked = true;
  } else {
    app.classList.remove('dark');
    app.classList.add('light');
    themeToggle.checked = false;
  }
  updateIcons();
}

const themeToggle = document.getElementById('theme-toggle');
const app = document.getElementById('app');
themeToggle.addEventListener('change', () => {
  if (themeToggle.checked) {
    app.classList.remove('light');
    app.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    app.classList.remove('dark');
    app.classList.add('light');
    localStorage.setItem('theme', 'light');
  }
  updateIcons();
});

document.addEventListener('DOMContentLoaded', () => {
  chosenTheme();
  getTodos();
});

selectTodo.addEventListener('change', () => renderTodo(selectTodo.value));
