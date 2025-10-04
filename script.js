const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sql = require('mssql');

const dbConfig = {
    user: 'sa',
    password: 'Vini2609@',
    server: 'localhost',
    database: 'FIND_COST_TO_SELL',
    options: {
        encrypt: false,
        trustServerCertificate: false,
    },
};

const app = express();
app.use(cors());
app.use(bodyParser.json());

sql.connect(dbConfig)
    .then(pool => {
        console.log('Conexão com o banco de dados estabelecida!');

        const executeQuery = async (query, params = []) => {
            const request = pool.request();
            params.forEach(p => request.input(p.name, p.type, p.value));
            return await request.query(query);
        };

        // 📌 ROTAS DE CLIENTES
        
        // Cadastrar Cliente
        app.post('/clients', async (req, res) => {
            const { Nome, Email, Telefone } = req.body;
            if (!Nome) return res.status(400).send('Nome é obrigatório.');

            try {
                const query = `INSERT INTO Clientes (Nome, Email, Telefone) VALUES (@Nome, @Email, @Telefone)`;
                await executeQuery(query, [
                    { name: 'Nome', type: sql.NVarChar, value: Nome },
                    { name: 'Email', type: sql.NVarChar, value: Email },
                    { name: 'Telefone', type: sql.NVarChar, value: Telefone },
                ]);
                res.status(201).send('Cliente cadastrado com sucesso!');
            } catch (error) {
                console.error('Erro ao cadastrar cliente:', error);
                res.status(500).send('Erro ao cadastrar cliente.');
            }
        });

        // Listar Clientes
        app.get('/clients', async (req, res) => {
            try {
                const result = await executeQuery('SELECT * FROM Clientes');
                res.status(200).json(result.recordset);
            } catch (error) {
                console.error('Erro ao buscar clientes:', error);
                res.status(500).send('Erro ao buscar clientes.');
            }
        });

        // Atualizar Cliente
        app.put('/clients/:id', async (req, res) => {
            const { id } = req.params;
            const { Nome, Email, Telefone } = req.body;

            if (!Nome) return res.status(400).send('Nome é obrigatório.');

            try {
                const query = `UPDATE Clientes SET Nome = @Nome, Email = @Email, Telefone = @Telefone WHERE Id = @Id`;
                const result = await executeQuery(query, [
                    { name: 'Id', type: sql.Int, value: parseInt(id) },
                    { name: 'Nome', type: sql.NVarChar, value: Nome },
                    { name: 'Email', type: sql.NVarChar, value: Email },
                    { name: 'Telefone', type: sql.NVarChar, value: Telefone },
                ]);

                if (result.rowsAffected[0] > 0) {
                    res.status(200).send('Cliente atualizado com sucesso!');
                } else {
                    res.status(404).send('Cliente não encontrado.');
                }
            } catch (error) {
                console.error('Erro ao atualizar cliente:', error);
                res.status(500).send('Erro ao atualizar cliente.');
            }
        });

        // Remover Cliente
        app.delete('/clients/:id', async (req, res) => {
            const { id } = req.params;

            try {
                const query = 'DELETE FROM Clientes WHERE Id = @Id';
                const result = await executeQuery(query, [
                    { name: 'Id', type: sql.Int, value: parseInt(id) }
                ]);

                if (result.rowsAffected[0] > 0) {
                    res.status(200).send({ message: 'Cliente removido com sucesso!' });
                } else {
                    res.status(404).send({ message: 'Cliente não encontrado.' });
                }
            } catch (error) {
                console.error('Erro ao remover cliente:', error);
                res.status(500).send({ message: 'Erro ao remover cliente.' });
            }
        });

        // 📌 ROTAS DE PRODUTOS
        
        // Cadastrar Produto
        app.post('/products', async (req, res) => {
            const { Nome, Preco, Estoque } = req.body;
            if (!Nome || Preco == null || Estoque == null) {
                return res.status(400).send('Nome, Preço e Estoque são obrigatórios.');
            }

            try {
                const query = 'INSERT INTO Produtos (Nome, Preco, Estoque) VALUES (@Nome, @Preco, @Estoque)';
                await executeQuery(query, [
                    { name: 'Nome', type: sql.NVarChar, value: Nome },
                    { name: 'Preco', type: sql.Float, value: Preco },
                    { name: 'Estoque', type: sql.Int, value: Estoque },
                ]);
                res.status(201).send('Produto cadastrado com sucesso!');
            } catch (error) {
                console.error('Erro ao cadastrar produto:', error);
                res.status(500).send('Erro ao cadastrar produto.');
            }
        });

        // Listar Produtos
        app.get('/products', async (req, res) => {
            try {
                const result = await executeQuery('SELECT * FROM Produtos');
                res.status(200).json(result.recordset);
            } catch (error) {
                console.error('Erro ao carregar produtos:', error);
                res.status(500).send('Erro ao carregar produtos.');
            }
        });

        // Atualizar Produto
        app.put('/products/:id', async (req, res) => {
            const { id } = req.params;
            const { Nome, Preco, Estoque } = req.body;

            if (!Nome || Preco == null || Estoque == null) {
                return res.status(400).send('Nome, Preço e Estoque são obrigatórios.');
            }

            try {
                const query = 'UPDATE Produtos SET Nome = @Nome, Preco = @Preco, Estoque = @Estoque WHERE Id = @Id';
                const result = await executeQuery(query, [
                    { name: 'Id', type: sql.Int, value: parseInt(id) },
                    { name: 'Nome', type: sql.NVarChar, value: Nome },
                    { name: 'Preco', type: sql.Float, value: Preco },
                    { name: 'Estoque', type: sql.Int, value: Estoque },
                ]);

                if (result.rowsAffected[0] > 0) {
                    res.status(200).send('Produto atualizado com sucesso!');
                } else {
                    res.status(404).send('Produto não encontrado.');
                }
            } catch (error) {
                console.error('Erro ao atualizar produto:', error);
                res.status(500).send('Erro ao atualizar produto.');
            }
        });

        // Remover Produto
        app.delete('/products/:id', async (req, res) => {
            const { id } = req.params;

            try {
                const query = 'DELETE FROM Produtos WHERE Id = @Id';
                const result = await executeQuery(query, [
                    { name: 'Id', type: sql.Int, value: parseInt(id) }
                ]);

                if (result.rowsAffected[0] > 0) {
                    res.status(200).send({ message: 'Produto removido com sucesso!' });
                } else {
                    res.status(404).send({ message: 'Produto não encontrado.' });
                }
            } catch (error) {
                console.error('Erro ao remover produto:', error);
                res.status(500).send({ message: 'Erro ao remover produto.' });
            }
        });

        // 📌 ROTAS DE VENDAS - CORRIGIDAS
        
        // Registrar Venda
        app.post('/sales', async (req, res) => {
            const { ClienteId, ProdutoId, Quantidade } = req.body;

            try {
                console.log('Tentando registrar venda:', { ClienteId, ProdutoId, Quantidade });

                // Verificar se o produto existe e tem estoque suficiente
                const productQuery = 'SELECT Preco, Estoque FROM Produtos WHERE Id = @ProdutoId';
                const productResult = await executeQuery(productQuery, [
                    { name: 'ProdutoId', type: sql.Int, value: ProdutoId },
                ]);

                if (!productResult.recordset.length) {
                    return res.status(404).send('Produto não encontrado.');
                }

                const produto = productResult.recordset[0];
                
                if (produto.Estoque < Quantidade) {
                    return res.status(400).send(`Estoque insuficiente. Disponível: ${produto.Estoque}`);
                }

                const Preco = produto.Preco;
                const ValorVenda = Quantidade * Preco;

                // Atualizar estoque do produto
                const updateStockQuery = 'UPDATE Produtos SET Estoque = Estoque - @Quantidade WHERE Id = @ProdutoId';
                await executeQuery(updateStockQuery, [
                    { name: 'Quantidade', type: sql.Int, value: Quantidade },
                    { name: 'ProdutoId', type: sql.Int, value: ProdutoId }
                ]);

                // Registrar a venda
                const query = `INSERT INTO Vendas (ClienteId, ProdutoId, Quantidade, ValorVenda, Data)
                               VALUES (@ClienteId, @ProdutoId, @Quantidade, @ValorVenda, GETDATE())`;
                const insertResult = await executeQuery(query, [
                    { name: 'ClienteId', type: sql.Int, value: ClienteId },
                    { name: 'ProdutoId', type: sql.Int, value: ProdutoId },
                    { name: 'Quantidade', type: sql.Int, value: Quantidade },
                    { name: 'ValorVenda', type: sql.Float, value: ValorVenda },
                ]);

                console.log('Venda registrada com sucesso!');
                res.status(201).send('Venda registrada com sucesso!');
            } catch (error) {
                console.error('Erro detalhado ao registrar venda:', error);
                res.status(500).send('Erro ao registrar venda: ' + error.message);
            }
        });

        // Listar Vendas - CORRIGIDA
        app.get('/sales', async (req, res) => {
            try {
                console.log('🔍 Buscando vendas...');
                
                // Verificar se existem vendas
                const countQuery = 'SELECT COUNT(*) as total FROM Vendas';
                const countResult = await executeQuery(countQuery);
                const totalVendas = countResult.recordset[0].total;
                
                console.log(`📊 Total de vendas no banco: ${totalVendas}`);

                if (totalVendas === 0) {
                    console.log('ℹ️ Nenhuma venda encontrada no banco');
                    return res.status(200).json([]);
                }

                const query = `SELECT 
                    Vendas.Id, 
                    Vendas.ClienteId, 
                    Vendas.ProdutoId, 
                    Clientes.Nome AS Cliente, 
                    Produtos.Nome AS Produto,
                    Vendas.Quantidade, 
                    Vendas.ValorVenda, 
                    Vendas.Data
                FROM Vendas
                INNER JOIN Clientes ON Vendas.ClienteId = Clientes.Id
                INNER JOIN Produtos ON Vendas.ProdutoId = Produtos.Id
                ORDER BY Vendas.Data DESC`;

                console.log('📋 Executando query de vendas...');
                const result = await executeQuery(query);
                console.log(`✅ ${result.recordset.length} vendas carregadas com sucesso`);
                
                // Log das primeiras vendas para debug
                if (result.recordset.length > 0) {
                    console.log('📝 Primeira venda:', {
                        id: result.recordset[0].Id,
                        cliente: result.recordset[0].Cliente,
                        produto: result.recordset[0].Produto,
                        quantidade: result.recordset[0].Quantidade,
                        valor: result.recordset[0].ValorVenda
                    });
                }

                res.status(200).json(result.recordset);
            } catch (error) {
                console.error('❌ Erro detalhado ao buscar vendas:', error);
                res.status(500).json({ 
                    error: 'Erro ao buscar vendas',
                    details: error.message 
                });
            }
        });

        // Remover Venda
        app.delete('/sales/:id', async (req, res) => {
            const { id } = req.params;

            try {
                // Primeiro, buscar informações da venda para restaurar o estoque
                const saleQuery = 'SELECT ProdutoId, Quantidade FROM Vendas WHERE Id = @Id';
                const saleResult = await executeQuery(saleQuery, [
                    { name: 'Id', type: sql.Int, value: parseInt(id) }
                ]);

                if (!saleResult.recordset.length) {
                    return res.status(404).send({ message: 'Venda não encontrada.' });
                }

                const sale = saleResult.recordset[0];

                // Restaurar estoque
                const restoreStockQuery = 'UPDATE Produtos SET Estoque = Estoque + @Quantidade WHERE Id = @ProdutoId';
                await executeQuery(restoreStockQuery, [
                    { name: 'Quantidade', type: sql.Int, value: sale.Quantidade },
                    { name: 'ProdutoId', type: sql.Int, value: sale.ProdutoId }
                ]);

                // Excluir venda
                const deleteQuery = 'DELETE FROM Vendas WHERE Id = @Id';
                const deleteResult = await executeQuery(deleteQuery, [
                    { name: 'Id', type: sql.Int, value: parseInt(id) }
                ]);

                if (deleteResult.rowsAffected[0] > 0) {
                    res.status(200).send({ message: 'Venda removida com sucesso!' });
                } else {
                    res.status(404).send({ message: 'Venda não encontrada.' });
                }
            } catch (error) {
                console.error('Erro ao remover venda:', error);
                res.status(500).send({ message: 'Erro ao remover venda.' });
            }
        });

        // 📌 ROTA DE DIAGNÓSTICO
        app.get('/debug/database', async (req, res) => {
            try {
                console.log('🔧 Verificando estado do banco...');
                
                // Contar registros em cada tabela
                const clientsCount = await executeQuery('SELECT COUNT(*) as total FROM Clientes');
                const productsCount = await executeQuery('SELECT COUNT(*) as total FROM Produtos');
                const salesCount = await executeQuery('SELECT COUNT(*) as total FROM Vendas');
                
                const diagnostic = {
                    database: 'FIND_COST_TO_SELL',
                    connection: 'OK',
                    tables: {
                        Clientes: {
                            records: clientsCount.recordset[0].total
                        },
                        Produtos: {
                            records: productsCount.recordset[0].total
                        },
                        Vendas: {
                            records: salesCount.recordset[0].total
                        }
                    },
                    lastSales: []
                };

                // Pegar últimas 3 vendas se existirem
                if (salesCount.recordset[0].total > 0) {
                    const lastSales = await executeQuery(`
                        SELECT TOP 3 Vendas.*, Clientes.Nome as ClienteNome, Produtos.Nome as ProdutoNome
                        FROM Vendas
                        LEFT JOIN Clientes ON Vendas.ClienteId = Clientes.Id
                        LEFT JOIN Produtos ON Vendas.ProdutoId = Produtos.Id
                        ORDER BY Vendas.Data DESC
                    `);
                    diagnostic.lastSales = lastSales.recordset;
                }

                console.log('📋 Diagnóstico:', diagnostic);
                res.json(diagnostic);
            } catch (error) {
                console.error('❌ Erro no diagnóstico:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // 📌 CRIAR VENDA DE TESTE
        app.post('/debug/create-test-sale', async (req, res) => {
            try {
                console.log('🧪 Criando venda de teste...');
                
                // Verificar se existem clientes e produtos
                const clients = await executeQuery('SELECT TOP 1 Id FROM Clientes');
                const products = await executeQuery('SELECT TOP 1 Id, Preco, Estoque FROM Produtos');
                
                if (clients.recordset.length === 0) {
                    return res.status(400).send('Crie um cliente primeiro');
                }
                if (products.recordset.length === 0) {
                    return res.status(400).send('Crie um produto primeiro');
                }

                const clienteId = clients.recordset[0].Id;
                const produtoId = products.recordset[0].Id;
                const quantidade = 1;

                // Registrar venda
                const query = `INSERT INTO Vendas (ClienteId, ProdutoId, Quantidade, ValorVenda, Data)
                               VALUES (@ClienteId, @ProdutoId, @Quantidade, @ValorVenda, GETDATE())`;
                
                await executeQuery(query, [
                    { name: 'ClienteId', type: sql.Int, value: clienteId },
                    { name: 'ProdutoId', type: sql.Int, value: produtoId },
                    { name: 'Quantidade', type: sql.Int, value: quantidade },
                    { name: 'ValorVenda', type: sql.Float, value: products.recordset[0].Preco * quantidade },
                ]);

                console.log('✅ Venda de teste criada com sucesso!');
                res.status(201).send('Venda de teste criada com sucesso!');
            } catch (error) {
                console.error('❌ Erro ao criar venda de teste:', error);
                res.status(500).send('Erro ao criar venda de teste: ' + error.message);
            }
        });

        // Iniciar o servidor
        app.listen(4000, () => console.log('Servidor rodando na porta 4000!'));
    })
    .catch(error => console.error('Erro ao conectar ao banco de dados:', error));