const API = 'http://localhost:3000/api/todos';
let todos = [];

const todoList = document.getElementById('todo-list');
const selectTodo = document.getElementById('todo-select');
let addedNowTodo = 0;
let addedAllTimeTodo = 0;
let deletedAllTimeTodo = 0;

const inputField = document.getElementById('todo-input');

// переменные для модалок
let deleteTimer;
let todoToDelete = null;
let todoToEdit = null;
let hasCreatedFirstTodo = false;

// отрисовка
function renderTodo(filterType = 'all') {
  todoList.innerHTML = '';
  // сортировка готовности задач
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

    // сортировка по возрастанию
    const sortType = document.getElementById('todo-sort').value;
    if (sortType === 'asc') {
      filteredTodos.sort((a, b) =>
        a.title.toLowerCase().localeCompare(b.title.toLowerCase()),
      );
    } else if (sortType === 'desc') {
      filteredTodos.sort((a, b) =>
        b.title.toLowerCase().localeCompare(a.title.toLowerCase()),
      );
    }

    const span = document.createElement('span');
    span.textContent = todo.title;

    const editBtn = document.createElement('button');
    editBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
`;
    editBtn.className = 'edit-btn';
    editBtn.type = 'button';
    editBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      editTodo(todo.id);
    });

    const delBtn = document.createElement('button');
    delBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24">
        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
`;
    delBtn.className = 'del-btn';
    delBtn.type = 'button';
    delBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      deletedTodo(todo.id);
    });

    const todoActions = document.createElement('div');
    todoActions.className = 'todo-actions';
    todoActions.appendChild(editBtn);
    todoActions.appendChild(delBtn);

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(todoActions);

    todoList.appendChild(li);
  });
  updateStats();
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
    const todo = todos.find((todo) => todo.id === todoId);
    await axios.patch(`${API}/${todoId}`, {
      completed: todos.find((todo) => todo.id === todoId).completed,
    });
    localStorage.setItem('todos', JSON.stringify(todos));

    await getTodos();
  } catch (error) {
    console.error('Error toggle', error);
  }
  renderTodo(selectTodo.value);
}

// статистика задач
function getAddedNowTodo() {
  return todos.length;
}

function getAddedAllTimeTodo() {
  return addedAllTimeTodo;
}

function getDeletedAllTimeTodo() {
  return deletedAllTimeTodo;
}

// обновление статистики
function updateStats() {
  let statsContainer = document.getElementById('stats-container');
  if (statsContainer) {
    statsContainer.innerHTML = `Added now Todo: ${getAddedNowTodo()} | Added All Time:${getAddedAllTimeTodo()} | Deleted All Time Todo: ${getDeletedAllTimeTodo()}`;
  }
}

//сохранение статистики в хранилище
function saveSessionStats() {
  localStorage.setItem(
    'sessionStats',
    JSON.stringify({
      added: addedAllTimeTodo,
      deleted: deletedAllTimeTodo,
    }),
  );
}

// получение всех задач
async function getTodos() {
  try {
    const sessionStats = localStorage.getItem('sessionStats');
    if (sessionStats) {
      const stats = JSON.parse(sessionStats);
      addedAllTimeTodo = stats.added || 0;
      deletedAllTimeTodo = stats.deleted || 0;
    }
    const response = await axios.get(API);
    todos = response.data;
    localStorage.setItem('todos', JSON.stringify(todos));
    renderTodo(selectTodo.value);
  } catch (error) {
    console.error('Error get', error);
  }
}

// добавление задачи через форму
const todoInput = document.getElementById('todo-input');

document.getElementById('todo-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  e.stopPropagation();
  const title = todoInput.value.trim();
  if (!title) {
    const alertModal = document.getElementById('alertModal');
    alertModal.showModal();
    document.getElementById('cancel-alert-btn').addEventListener('click', () => {
      alertModal.close();
    });
    return;
  }

  try {
    const newTodo = {
      id: Date.now(),
      title: title,
      completed: false,
    };
    const response = await axios.post(API, newTodo);
    todos.push(response.data);
    addedAllTimeTodo++;
    saveSessionStats();
    localStorage.setItem('todos', JSON.stringify(todos));
    todoInput.value = '';
    renderTodo(selectTodo.value);
  } catch (error) {
    console.error('Error adding todo:', error);
  }
});
// добавление задачи по нажатию ентер
todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    document.getElementById('todo-form').dispatchEvent(new Event('submit'));
  }
});

// удаление с модальным окном
async function deletedTodo(id) {
  todoToDelete = id;
  const confirmationModal = document.getElementById('confirmationModal');
  const countdown = document.getElementById('countdown');

  confirmationModal.showModal();

  let timeLeft = 5;
  countdown.textContent = timeLeft;

  deleteTimer = setInterval(() => {
    timeLeft--;
    countdown.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(deleteTimer);
      confirmationModal.close();
      performDelete(todoToDelete);
    }
  }, 1000);
}

async function performDelete(id) {
  try {
    await axios.delete(`${API}/${id}`);
    todos = todos.filter((todo) => todo.id !== id);

    deletedAllTimeTodo++;
    saveSessionStats();

    localStorage.setItem('todos', JSON.stringify(todos));
    renderTodo(selectTodo.value);
  } catch (error) {
    console.error('Error delete', error);
  }
}

// удаление всех туду
document.getElementById('del-all-todo-btn').addEventListener('click', async () => {
  if (todos.length === 0) {
    inputField.classList.add('shake');
    inputField.addEventListener(
      'animationend',
      () => {
        inputField.classList.remove('shake');
      },
      { once: true },
    );
  }
  try {
    const todoDeleteCount = todos.length;

    for (const todo of todos) {
      await axios.delete(`${API}/${todo.id}`);
    }
    deletedAllTimeTodo += todoDeleteCount;
    saveSessionStats();

    localStorage.setItem('todos', JSON.stringify([]));
    todos = [];
    renderTodo(selectTodo.value);
  } catch (error) {
    console.error('Error delete all todos', error);
  }
});

// редактирование
async function editTodo(id) {
  todoToEdit = todos.find((todo) => todo.id === id);
  if (!todoToEdit) return;

  const editModal = document.getElementById('editModal');
  const titleInput = document.getElementById('title');

  titleInput.value = todoToEdit.title;
  editModal.showModal();
}

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

// обработчики для кнопок подтверждения удаления
document.getElementById('confirm-delete-btn').addEventListener('click', (e) => {
  e.preventDefault();
  clearInterval(deleteTimer);
  document.getElementById('confirmationModal').close();
  performDelete(todoToDelete);
});

document.getElementById('cancel-delete-btn').addEventListener('click', (e) => {
  e.preventDefault();
  clearInterval(deleteTimer);
  document.getElementById('confirmationModal').close();
  todoToDelete = null;
});

// обработчик формы редактирования
document.getElementById('modal-box').addEventListener('submit', async (e) => {
  e.preventDefault();

  const newTitle = document.getElementById('title').value.trim();
  if (!newTitle) return;

  try {
    await axios.patch(`${API}/${todoToEdit.id}`, {
      title: newTitle,
    });

    todos = todos.map((todo) =>
      todo.id === todoToEdit.id ? { ...todo, title: newTitle } : todo,
    );

    localStorage.setItem('todos', JSON.stringify(todos));
    document.getElementById('editModal').close();

    renderTodo(selectTodo.value);
  } catch (error) {
    console.error('Error editing todo:', error);
  }
});

// обработчик кнопки отмены редактирования
document.getElementById('close-btn').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('editModal').close();
});

// обработчик изменения сортировки

document.getElementById('todo-sort').addEventListener('change', () => {
  renderTodo(document.getElementById('todo-select').value);
});

// закрытие модальных окон по клику на backdrop
document.getElementById('confirmationModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('confirmationModal')) {
    clearInterval(deleteTimer);
    document.getElementById('confirmationModal').close();
    todoToDelete = null;
  }
});

document.getElementById('editModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('editModal')) {
    document.getElementById('editModal').close();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const sessionStats = localStorage.getItem('sessionStats');
  if (sessionStats) {
    const stats = JSON.parse(sessionStats);
    addedAllTimeTodo = stats.added || 0;
    deletedAllTimeTodo = stats.deleted || 0;
  }
  chosenTheme();
  getTodos();
});

selectTodo.addEventListener('change', () => renderTodo(selectTodo.value));
