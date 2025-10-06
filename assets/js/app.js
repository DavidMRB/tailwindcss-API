const API_BASE_URL = 'https://todoapitest.juansegaliz.com';
let todos = [];

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    errorText.textContent = message;
    errorDiv.classList.remove('hidden');
    setTimeout(() => errorDiv.classList.add('hidden'), 5000);
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    const successText = document.getElementById('successText');
    successText.textContent = message;
    successDiv.classList.remove('hidden');
    setTimeout(() => successDiv.classList.add('hidden'), 3000);
}

function getPriorityColor(priority) {
    switch (priority) {
        case 3: return 'bg-red-100 text-red-800';
        case 2: return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-green-100 text-green-800';
    }
}

function getPriorityLabel(priority) {
    switch (priority) {
        case 3: return 'Alta';
        case 2: return 'Media';
        default: return 'Baja';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function toLocalDateTime(dateString) {
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().slice(0, 16);
}

async function loadTodos() {
    try {
        const response = await fetch(`${API_BASE_URL}/todos`);
        if (!response.ok) throw new Error('Error al cargar los todos');
        
        const data = await response.json();
        todos = data.data;
        renderTodos();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los todos');
    } finally {
        document.getElementById('loading').classList.add('hidden');
    }
}

async function getTodoById(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/todos/${id}`);
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`No se encontró ningún todo con el ID ${id}`);
            }
            throw new Error(`Error al buscar el todo ${id}`);
        }
        
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

async function createTodo(todoData) {
    try {
        const response = await fetch(`${API_BASE_URL}/todos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(todoData),
        });
        
        if (!response.ok) throw new Error('Error al crear el todo');
        
        const data = await response.json();
        showSuccess(`✅ Todo creado exitosamente con ID: ${data.data.id}`);
        await loadTodos();
        document.getElementById('createForm').reset();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al crear el todo');
    }
}

async function updateTodo(id, todoData) {
    try {
        const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(todoData),
        });
        
        if (!response.ok) throw new Error('Error al actualizar el todo');
        
        showSuccess('✅ Todo actualizado exitosamente');
        await loadTodos();
        closeEditModal();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al actualizar el todo');
    }
}

async function deleteTodo(id) {
    if (!confirm('¿Estás seguro de eliminar este todo?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
            method: 'DELETE',
        });
        
        if (!response.ok) throw new Error('Error al eliminar el todo');
        
        showSuccess('✅ Todo eliminado exitosamente');
        await loadTodos();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al eliminar el todo');
    }
}

async function toggleComplete(todo) {
    const updateData = {
        title: todo.title,
        description: todo.description,
        isCompleted: !todo.isCompleted,
        priority: todo.priority,
        dueAt: todo.dueAt,
    };
    await updateTodo(todo.id, updateData);
}

function renderTodos() {
    const todoList = document.getElementById('todoList');
    const todoCount = document.getElementById('todoCount');
    const todoListContainer = document.getElementById('todoListContainer');
    const emptyState = document.getElementById('emptyState');

    todoCount.textContent = todos.length;

    if (todos.length === 0) {
        todoListContainer.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    todoListContainer.classList.remove('hidden');
    emptyState.classList.add('hidden');

    todoList.innerHTML = todos.map(todo => `
        <div class="p-6 hover:bg-gray-50 transition-colors">
            <div class="flex flex-col sm:flex-row items-start gap-4">
                <input
                    type="checkbox"
                    ${todo.isCompleted ? 'checked' : ''}
                    onchange='toggleComplete(${JSON.stringify(todo).replace(/'/g, "&#39;")})'
                    class="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                >

                <div class="flex-1 min-w-0">
                    <div class="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-4 mb-2">
                        <div class="flex-1 min-w-0 w-full">
                            <span class="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block">ID: ${todo.id}</span>
                            <h3 class="text-lg font-medium mt-2 ${todo.isCompleted ? 'line-through text-gray-400' : 'text-gray-900'} break-words">
                                ${todo.title}
                            </h3>
                        </div>
                        <span class="px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getPriorityColor(todo.priority)} self-start">
                            ${getPriorityLabel(todo.priority)}
                        </span>
                    </div>

                    ${todo.description ? `
                        <p class="text-sm mb-3 ${todo.isCompleted ? 'text-gray-400' : 'text-gray-600'} break-words">
                            ${todo.description}
                        </p>
                    ` : ''}

                    <div class="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
                        <span>📅 Vence: ${formatDate(todo.dueAt)}</span>
                        <span>🕐 Creado: ${formatDate(todo.createdAt)}</span>
                    </div>
                </div>

                <div class="flex flex-row sm:flex-col lg:flex-row gap-2 w-full sm:w-auto">
                    <button
                        onclick="viewTodoDetail(${todo.id})"
                        class="flex-1 sm:flex-none px-3 py-1.5 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors font-medium whitespace-nowrap"
                    >
                        Ver
                    </button>
                    <button
                        onclick="openEditModal(${todo.id})"
                        class="flex-1 sm:flex-none px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium whitespace-nowrap"
                    >
                        Editar
                    </button>
                    <button
                        onclick="deleteTodo(${todo.id})"
                        class="flex-1 sm:flex-none px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium whitespace-nowrap"
                    >
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

async function handleSearch(e) {
    e.preventDefault();
    const searchId = parseInt(document.getElementById('searchId').value);
    const searchResult = document.getElementById('searchResult');

    try {
        const todo = await getTodoById(searchId);
        
        searchResult.innerHTML = `
            <div class="bg-blue-50 border-2 border-blue-500 rounded-lg p-4 mt-4">
                <h3 class="text-lg font-semibold text-blue-900 mb-3">✅ Todo encontrado</h3>
                <div class="space-y-2 text-sm">
                    <div class="flex flex-col sm:flex-row sm:gap-4">
                        <span class="font-semibold text-blue-900 min-w-[150px]">ID:</span>
                        <span class="text-gray-700">${todo.id}</span>
                    </div>
                    <div class="flex flex-col sm:flex-row sm:gap-4">
                        <span class="font-semibold text-blue-900 min-w-[150px]">Título:</span>
                        <span class="text-gray-700">${todo.title}</span>
                    </div>
                    <div class="flex flex-col sm:flex-row sm:gap-4">
                        <span class="font-semibold text-blue-900 min-w-[150px]">Descripción:</span>
                        <span class="text-gray-700">${todo.description || 'Sin descripción'}</span>
                    </div>
                    <div class="flex flex-col sm:flex-row sm:gap-4">
                        <span class="font-semibold text-blue-900 min-w-[150px]">Estado:</span>
                        <span class="text-gray-700">${todo.isCompleted ? '✅ Completado' : '⏳ Pendiente'}</span>
                    </div>
                    <div class="flex flex-col sm:flex-row sm:gap-4">
                        <span class="font-semibold text-blue-900 min-w-[150px]">Prioridad:</span>
                        <span class="inline-flex">
                            <span class="px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(todo.priority)}">
                                ${getPriorityLabel(todo.priority)}
                            </span>
                        </span>
                    </div>
                    <div class="flex flex-col sm:flex-row sm:gap-4">
                        <span class="font-semibold text-blue-900 min-w-[150px]">Fecha de vencimiento:</span>
                        <span class="text-gray-700">${formatDate(todo.dueAt)}</span>
                    </div>
                    <div class="flex flex-col sm:flex-row sm:gap-4">
                        <span class="font-semibold text-blue-900 min-w-[150px]">Creado:</span>
                        <span class="text-gray-700">${formatDate(todo.createdAt)}</span>
                    </div>
                    <div class="flex flex-col sm:flex-row sm:gap-4">
                        <span class="font-semibold text-blue-900 min-w-[150px]">Actualizado:</span>
                        <span class="text-gray-700">${formatDate(todo.updatedAt)}</span>
                    </div>
                </div>
            </div>
        `;
        searchResult.classList.remove('hidden');
        showSuccess(`Todo con ID ${searchId} encontrado exitosamente`);
    } catch (error) {
        searchResult.innerHTML = `
            <div class="bg-red-50 border-2 border-red-500 rounded-lg p-4 mt-4">
                <h3 class="text-lg font-semibold text-red-900 mb-2">❌ No encontrado</h3>
                <p class="text-red-700">${error.message}</p>
            </div>
        `;
        searchResult.classList.remove('hidden');
        showError(error.message);
    }
}

async function viewTodoDetail(id) {
    try {
        const todo = await getTodoById(id);
        const modalContent = document.getElementById('viewModalContent');
        
        modalContent.innerHTML = `
            <div class="space-y-3">
                <div class="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-gray-200">
                    <span class="font-semibold text-gray-700 min-w-[150px]">ID:</span>
                    <span class="text-gray-900">${todo.id}</span>
                </div>
                <div class="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-gray-200">
                    <span class="font-semibold text-gray-700 min-w-[150px]">Título:</span>
                    <span class="text-gray-900">${todo.title}</span>
                </div>
                <div class="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-gray-200">
                    <span class="font-semibold text-gray-700 min-w-[150px]">Descripción:</span>
                    <span class="text-gray-900">${todo.description || 'Sin descripción'}</span>
                </div>
                <div class="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-gray-200">
                    <span class="font-semibold text-gray-700 min-w-[150px]">Estado:</span>
                    <span class="text-gray-900">${todo.isCompleted ? '✅ Completado' : '⏳ Pendiente'}</span>
                </div>
                <div class="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-gray-200">
                    <span class="font-semibold text-gray-700 min-w-[150px]">Prioridad:</span>
                    <span class="inline-flex">
                        <span class="px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(todo.priority)}">
                            ${getPriorityLabel(todo.priority)}
                        </span>
                    </span>
                </div>
                <div class="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-gray-200">
                    <span class="font-semibold text-gray-700 min-w-[150px]">Fecha de vencimiento:</span>
                    <span class="text-gray-900">${formatDate(todo.dueAt)}</span>
                </div>
                <div class="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-gray-200">
                    <span class="font-semibold text-gray-700 min-w-[150px]">Creado:</span>
                    <span class="text-gray-900">${formatDate(todo.createdAt)}</span>
                </div>
                <div class="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-gray-200">
                    <span class="font-semibold text-gray-700 min-w-[150px]">Actualizado:</span>
                    <span class="text-gray-900">${formatDate(todo.updatedAt)}</span>
                </div>
                <div class="mt-6">
                    <button onclick="closeViewModal()" class="w-full px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                        Cerrar
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('viewModal').classList.remove('hidden');
    } catch (error) {
        showError(`Error al cargar el detalle del todo: ${error.message}`);
    }
}

function openEditModal(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    document.getElementById('editId').value = todo.id;
    document.getElementById('editTitle').value = todo.title;
    document.getElementById('editDescription').value = todo.description;
    document.getElementById('editCompleted').checked = todo.isCompleted;
    document.getElementById('editPriority').value = todo.priority;
    document.getElementById('editDueAt').value = toLocalDateTime(todo.dueAt);

    document.getElementById('editModal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
    document.getElementById('editForm').reset();
}

function closeViewModal() {
    document.getElementById('viewModal').classList.add('hidden');
}

document.getElementById('searchForm').addEventListener('submit', handleSearch);

document.getElementById('createForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const todoData = {
        title: formData.get('title').trim(),
        description: formData.get('description').trim(),
        priority: parseInt(formData.get('priority')),
        dueAt: formData.get('dueAt') || new Date().toISOString(),
    };

    await createTodo(todoData);
});

document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = parseInt(document.getElementById('editId').value);
    const todoData = {
        title: document.getElementById('editTitle').value.trim(),
        description: document.getElementById('editDescription').value.trim(),
        isCompleted: document.getElementById('editCompleted').checked,
        priority: parseInt(document.getElementById('editPriority').value),
        dueAt: new Date(document.getElementById('editDueAt').value).toISOString(),
    };

    await updateTodo(id, todoData);
});

document.getElementById('editModal').addEventListener('click', (e) => {
    if (e.target.id === 'editModal') {
        closeEditModal();
    }
});

document.getElementById('viewModal').addEventListener('click', (e) => {
    if (e.target.id === 'viewModal') {
        closeViewModal();
    }
});

loadTodos();