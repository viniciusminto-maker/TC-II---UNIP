// Base URL da API
const API_BASE = 'http://localhost:4000';

// Elementos DOM
const elements = {
    clientForm: document.getElementById('clientForm'),
    productForm: document.getElementById('productForm'),
    saleForm: document.getElementById('saleForm'),
    clientList: document.getElementById('clientList'),
    productList: document.getElementById('productList'),
    salesList: document.getElementById('salesList')
};

// Função para exibir mensagens de alerta
function showAlert(message, type = 'success') {
    // Remove alertas existentes
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // Cria novo alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Insere no topo da página
    document.querySelector('.container').insertBefore(alertDiv, document.querySelector('main'));
    
    // Remove após 5 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Função para recarregar todas as listas
async function reloadAllLists() {
    try {
        await Promise.all([
            loadClients(),
            loadProducts(),
            loadSales()
        ]);
    } catch (error) {
        console.error('Erro ao recarregar listas:', error);
    }
}

// Função para cadastrar um cliente
elements.clientForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    
    const name = document.getElementById('clientName').value.trim();
    const email = document.getElementById('clientEmail').value.trim();
    const phone = document.getElementById('clientPhone').value.trim();

    if (!name || !email || !phone) {
        showAlert('Por favor, preencha todos os campos.', 'error');
        return;
    }

    const client = { Nome: name, Email: email, Telefone: phone };

    try {
        const response = await fetch(`${API_BASE}/clients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(client),
        });

        if (response.ok) {
            showAlert('Cliente cadastrado com sucesso!');
            elements.clientForm.reset();
            await reloadAllLists();
        } else {
            showAlert('Erro ao cadastrar cliente.', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showAlert('Erro de conexão. Verifique se o servidor está rodando.', 'error');
    }
});

// Função para cadastrar um produto
elements.productForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    
    const name = document.getElementById('productName').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const stock = parseInt(document.getElementById('productStock').value);

    if (!name || isNaN(price) || isNaN(stock) || price < 0 || stock < 0) {
        showAlert('Por favor, preencha todos os campos corretamente.', 'error');
        return;
    }

    const product = { Nome: name, Preco: price, Estoque: stock };

    try {
        const response = await fetch(`${API_BASE}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(product),
        });

        if (response.ok) {
            showAlert('Produto cadastrado com sucesso!');
            elements.productForm.reset();
            await reloadAllLists();
        } else {
            showAlert('Erro ao cadastrar produto.', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showAlert('Erro de conexão. Verifique se o servidor está rodando.', 'error');
    }
});

// Função para registrar uma venda
elements.saleForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    
    const clientId = parseInt(document.getElementById('saleClient').value);
    const productId = parseInt(document.getElementById('saleProduct').value);
    const quantity = parseInt(document.getElementById('saleQuantity').value);

    if (isNaN(clientId) || isNaN(productId) || isNaN(quantity) || quantity <= 0) {
        showAlert('Por favor, preencha todos os campos corretamente.', 'error');
        return;
    }

    const sale = {
        ClienteId: clientId,
        ProdutoId: productId,
        Quantidade: quantity
    };

    try {
        const response = await fetch(`${API_BASE}/sales`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sale),
        });

        if (response.ok) {
            showAlert('Venda registrada com sucesso!');
            elements.saleForm.reset();
            await reloadAllLists();
        } else {
            const errorText = await response.text();
            showAlert(`Erro ao registrar venda: ${errorText}`, 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showAlert('Erro de conexão. Verifique se o servidor está rodando.', 'error');
    }
});

// Função para excluir um cliente
async function deleteClient(id) {
    if (confirm("Tem certeza que deseja remover este cliente?")) {
        try {
            const response = await fetch(`${API_BASE}/clients/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                showAlert('Cliente removido com sucesso!');
                await reloadAllLists();
            } else {
                showAlert('Erro ao remover cliente.', 'error');
            }
        } catch (error) {
            console.error("Erro ao deletar cliente:", error);
            showAlert('Erro ao remover cliente.', 'error');
        }
    }
}

// Função para excluir um produto
async function deleteProduct(id) {
    if (confirm("Tem certeza que deseja remover este produto?")) {
        try {
            const response = await fetch(`${API_BASE}/products/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                showAlert('Produto removido com sucesso!');
                await reloadAllLists();
            } else {
                showAlert('Erro ao remover produto.', 'error');
            }
        } catch (error) {
            console.error("Erro ao deletar produto:", error);
            showAlert('Erro ao remover produto.', 'error');
        }
    }
}

// Função para excluir uma venda
async function deleteSale(id) {
    if (confirm("Tem certeza que deseja remover esta venda?")) {
        try {
            const response = await fetch(`${API_BASE}/sales/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                showAlert('Venda removida com sucesso!');
                await reloadAllLists();
            } else {
                showAlert('Erro ao remover venda.', 'error');
            }
        } catch (error) {
            console.error("Erro ao deletar venda:", error);
            showAlert('Erro ao remover venda.', 'error');
        }
    }
}

// Função para carregar a lista de clientes
async function loadClients() {
    try {
        const response = await fetch(`${API_BASE}/clients`);
        const clients = await response.json();
        const list = elements.clientList;
        list.innerHTML = '';

        if (clients.length === 0) {
            list.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum cliente cadastrado</td></tr>';
            return;
        }

        clients.forEach(client => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${client.Id}</td>
                <td>${client.Nome}</td>
                <td>${client.Email || '-'}</td>
                <td>${client.Telefone || '-'}</td>
                <td>
                    <button class="btn-danger" onclick="deleteClient(${client.Id})">🗑 Excluir</button>
                </td>`;
            list.appendChild(row);
        });
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        elements.clientList.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Erro ao carregar clientes</td></tr>';
    }
}

// Função para carregar a lista de produtos
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE}/products`);
        const products = await response.json();
        const list = elements.productList;
        list.innerHTML = '';

        if (products.length === 0) {
            list.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum produto cadastrado</td></tr>';
            return;
        }

        products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.Id}</td>
                <td>${product.Nome}</td>
                <td>R$ ${parseFloat(product.Preco).toFixed(2)}</td>
                <td>${product.Estoque}</td>
                <td>
                    <button class="btn-danger" onclick="deleteProduct(${product.Id})">🗑 Excluir</button>
                </td>`;
            list.appendChild(row);
        });
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        elements.productList.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Erro ao carregar produtos</td></tr>';
    }
}

// Função para carregar a lista de vendas
async function loadSales() {
    try {
        const response = await fetch(`${API_BASE}/sales`);
        const sales = await response.json();
        const list = elements.salesList;
        list.innerHTML = '';

        if (sales.length === 0) {
            list.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhuma venda registrada</td></tr>';
            return;
        }

        sales.forEach(sale => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${sale.Id}</td>
                <td>${sale.Cliente}</td>
                <td>${sale.Produto}</td>
                <td>${sale.Quantidade}</td>
                <td>R$ ${parseFloat(sale.ValorVenda).toFixed(2)}</td>
                <td>
                    <button class="btn-danger" onclick="deleteSale(${sale.Id})">🗑 Excluir</button>
                </td>`;
            list.appendChild(row);
        });
    } catch (error) {
        console.error('Erro ao carregar vendas:', error);
        elements.salesList.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Erro ao carregar vendas</td></tr>';
    }
}

// Carregar dados ao iniciar a página
document.addEventListener('DOMContentLoaded', function() {
    reloadAllLists();
});