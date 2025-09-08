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

function createModal(type, config) {
  const container = document.getElementById('modal-container');
  if (!container) {
    console.error('modal container not found');
    return null;
  }

  const modalOverlay = document.createElement('div');
  modalOverlay.id = `${type}Modal`;
  modalOverlay.className = `modal-overlay modal-overlay-${type}`;

  const modal = document.createElement('div');
  modal.className = `modal modal-${type}`;

  const content = document.createElement('div');
  content.className = `modal-content-${type}`;
  content.innerHTML = config.content;

  modal.appendChild(content);
  modalOverlay.appendChild(modal);
  container.appendChild(modalOverlay);

  if (config.handlers) {
    Object.entries(config.handlers).forEach(([selector, handler]) => {
      const elements = modal.querySelectorAll(selector);
      elements.forEach((element) => {
        element.addEventListener('click', (e) => handler(e, modal));
      });
    });
  }

  if (config.closeOnBackdrop !== false) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeModal(type);
      }
    });
  }

  return modalOverlay;
}

function showModal(type, config = {}) {
  let modal = document.getElementById(`${type}Modal`);

  if (!modal) {
    modal = createModal(type, config);
    if (!modal) return null;
  }

  if (config.beforeShow) {
    config.beforeShow(modal);
  }

  modal.style.display = 'flex';
  modal.classList.add('modal-show');

  if (config.afterShow) {
    config.afterShow(modal);
  }

  return modal;
}

function closeModal(type) {
  const modal = document.getElementById(`${type}Modal`);
  if (modal) {
    modal.classList.remove('modal-show');
    modal.classList.add('modal-hide');

    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

// конфиги для модалок

const modalConfigs = {
  alert: {
    content: `
    <div class='modal-header'>
    <p>Упс, что-то пошло не так: возможно, слишком мало символов в вашем инпуте...</p>
    </div>
    <div class="modal__footer">
        <button class="btn btn-primary close-alert">Понятно</button>
      </div>
    `,
    handlers: {
      '.close-alert': () => closeModal('alert'),
    },
  },

  confirmation: {
    content: `
          <div class="modal-header">
        <p>Удалить эту задачу?</p>
        <div class="timer-display">
          Автоудаление через: <span id="countdown">5</span> сек
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-danger confirm-delete">Удалить</button>
        <button class="btn btn-secondary cancel-delete">Отмена</button>
      </div>
    `,
    handlers: {
      '.confirm-delete': () => {
        clearInterval(window.deleteTimer);
        closeModal('confirmation');
        if (window.todoToDelete) {
          performDelete(window.todoToDelete);
        }
      },
      '.cancel-delete': () => {
        clearInterval(window.deleteTimer);
        closeModal('confirmation');
        window.todoToDelete = null;
      },
    },
  },

  edit: {
    content: `
       <div class="modal-header">
        <h3>Редактировать задачу</h3>
      </div>
          <div class="modal-body">
        <form id='edit-form'>
        <label class='form-label'>
        Title: 
        <input type='text' id='edit-title' class='form-input' required/>
        </label>
        </form>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary save-edit">Сохранить</button>
        <button class="btn btn-secondary cancel-edit">Отмена</button>
      </div>
    `,
    handlers: {
      '.save-edit': async () => {
        const input = document.getElementById('edit-title');
        const newTitle = input.value.trim();
        try {
          await axios.patch(`${API}/${window.todoToEdit.id}`, { title: newTitle });

          todos = todos.map((todo) =>
            todo.id === window.todoToEdit.id ? { ...todo, title: newTitle } : todo,
          );
          localStorage.setItem('todos', JSON.stringify(todos));
          closeModal('edit');

          renderTodo(document.getElementById('todo-select').value);
        } catch (error) {
          console.error('Error edit todo', error);
        }
      },
      '.cancel-edit': () => closeModal('edit'),
    },
  },
  popup: {
    content: `
      <div class="success-animation">🎉</div>
      <p>Ваша первая задача создана!</p>
    `,
    closeOnBackdrop: false,
  },
};

// показ модального окна с предупреждением

function showAlertModal() {
  showModal('alert', modalConfigs.alert);
}

// показ модалки удаления с таймером

function showConfirmationModal(todoId) {
  window.todoToDelete = todoId;

  showModal('confirmation', {
    ...modalConfigs.confirmation,
    afterShow: (modal) => {
      const countdown = modal.querySelector('#countdown');
      let time = 7;

      window.deleteTimer = setInterval(() => {
        time--;
        countdown.textContent = time;
        if (time <= 0) {
          clearInterval(window.deleteTimer);
          closeModal('confirmation');
          performDelete(window.todoToDelete);
        }
      }, 1000);
    },
  });
}

// показ модалки редактирования
function showEditModal(todoId) {
  const todo = todos.find((todo) => todo.id === todoId);
  if (!todo) return;
  window.todoToEdit = todo;

  showModal('edit', {
    ...modalConfigs.edit,
    beforeShow: (modal) => {
      const input = modal.querySelector('#edit-title');
      if (input) {
        input.value = todo.title;
      }
    },
  });
}
// popup
function showFirstTodoPopup() {
  const modal = showModal('popup', {
    ...modalConfigs.popup,
    afterShow: (modal) => {
     setTimeout(() => {
      modal.remove()
     },9000)
    },
  });
}

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
      showEditModal(todo.id);
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
      showConfirmationModal(todo.id);
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
    showAlertModal();
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

    if (todos.length === 1) {
      showFirstTodoPopup();
    }
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

// удаление

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

// смена темы
function updateIcons() {
  const moonIcon = document.querySelector('.theme-icon-moon');
  const sunIcon = document.querySelector('.theme-icon-sun');
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

// обработчик изменения сортировки

document.getElementById('todo-sort').addEventListener('change', () => {
  renderTodo(document.getElementById('todo-select').value);
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
