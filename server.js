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
                const query = `INSERT INTO Clientes (Nome, Email, Telefone, Ativo) VALUES (@Nome, @Email, @Telefone, 1)`;
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

        // Listar Clientes (apenas ativos por padrão)
        app.get('/clients', async (req, res) => {
            try {
                const query = 'SELECT * FROM Clientes WHERE Ativo = 1 ORDER BY Nome';
                const result = await executeQuery(query);
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

        // Inativar Cliente (soft delete)
        app.delete('/clients/:id', async (req, res) => {
            const { id } = req.params;

            try {
                // Verificar se o cliente tem vendas registradas
                const salesQuery = 'SELECT COUNT(*) as totalVendas FROM Vendas WHERE ClienteId = @Id';
                const salesResult = await executeQuery(salesQuery, [
                    { name: 'Id', type: sql.Int, value: parseInt(id) }
                ]);

                const totalVendas = salesResult.recordset[0].totalVendas;

                if (totalVendas > 0) {
                    // Inativar em vez de deletar (já que tem vendas)
                    const query = 'UPDATE Clientes SET Ativo = 0 WHERE Id = @Id';
                    const result = await executeQuery(query, [
                        { name: 'Id', type: sql.Int, value: parseInt(id) }
                    ]);

                    if (result.rowsAffected[0] > 0) {
                        res.status(200).send({ 
                            message: 'Cliente inativado com sucesso! (Possui vendas registradas)' 
                        });
                    } else {
                        res.status(404).send({ message: 'Cliente não encontrado.' });
                    }
                } else {
                    // Não tem vendas, pode deletar permanentemente
                    const query = 'DELETE FROM Clientes WHERE Id = @Id';
                    const result = await executeQuery(query, [
                        { name: 'Id', type: sql.Int, value: parseInt(id) }
                    ]);

                    if (result.rowsAffected[0] > 0) {
                        res.status(200).send({ message: 'Cliente removido com sucesso!' });
                    } else {
                        res.status(404).send({ message: 'Cliente não encontrado.' });
                    }
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
                const query = 'INSERT INTO Produtos (Nome, Preco, Estoque, Ativo) VALUES (@Nome, @Preco, @Estoque, 1)';
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

        // Listar Produtos (apenas ativos por padrão)
        app.get('/products', async (req, res) => {
            try {
                const query = 'SELECT * FROM Produtos WHERE Ativo = 1 ORDER BY Nome';
                const result = await executeQuery(query);
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

        // Inativar Produto (soft delete)
        app.delete('/products/:id', async (req, res) => {
            const { id } = req.params;

            try {
                // Verificar se o produto tem vendas registradas
                const salesQuery = 'SELECT COUNT(*) as totalVendas FROM Vendas WHERE ProdutoId = @Id';
                const salesResult = await executeQuery(salesQuery, [
                    { name: 'Id', type: sql.Int, value: parseInt(id) }
                ]);

                const totalVendas = salesResult.recordset[0].totalVendas;

                if (totalVendas > 0) {
                    // Inativar em vez de deletar (já que tem vendas)
                    const query = 'UPDATE Produtos SET Ativo = 0 WHERE Id = @Id';
                    const result = await executeQuery(query, [
                        { name: 'Id', type: sql.Int, value: parseInt(id) }
                    ]);

                    if (result.rowsAffected[0] > 0) {
                        res.status(200).send({ 
                            message: 'Produto inativado com sucesso! (Possui vendas registradas)' 
                        });
                    } else {
                        res.status(404).send({ message: 'Produto não encontrado.' });
                    }
                } else {
                    // Não tem vendas, pode deletar permanentemente
                    const query = 'DELETE FROM Produtos WHERE Id = @Id';
                    const result = await executeQuery(query, [
                        { name: 'Id', type: sql.Int, value: parseInt(id) }
                    ]);

                    if (result.rowsAffected[0] > 0) {
                        res.status(200).send({ message: 'Produto removido com sucesso!' });
                    } else {
                        res.status(404).send({ message: 'Produto não encontrado.' });
                    }
                }
            } catch (error) {
                console.error('Erro ao remover produto:', error);
                res.status(500).send({ message: 'Erro ao remover produto.' });
            }
        });

        // 📌 ROTAS DE VENDAS
        
        // Registrar Venda (só permite produtos ativos)
        app.post('/sales', async (req, res) => {
            const { ClienteId, ProdutoId, Quantidade } = req.body;

            try {
                // Verificar se o cliente está ativo
                const clientQuery = 'SELECT Id, Nome FROM Clientes WHERE Id = @ClienteId AND Ativo = 1';
                const clientResult = await executeQuery(clientQuery, [
                    { name: 'ClienteId', type: sql.Int, value: ClienteId },
                ]);

                if (!clientResult.recordset.length) {
                    return res.status(400).send('Cliente não encontrado ou inativo.');
                }

                // Verificar se o produto existe, está ativo e tem estoque suficiente
                const productQuery = 'SELECT Preco, Estoque FROM Produtos WHERE Id = @ProdutoId AND Ativo = 1';
                const productResult = await executeQuery(productQuery, [
                    { name: 'ProdutoId', type: sql.Int, value: ProdutoId },
                ]);

                if (!productResult.recordset.length) {
                    return res.status(400).send('Produto não encontrado ou inativo.');
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

                // Registrar a venda (usando DataVenda que é o nome correto na sua tabela)
                const query = `INSERT INTO Vendas (ClienteId, ProdutoId, Quantidade, ValorVenda, DataVenda)
                               VALUES (@ClienteId, @ProdutoId, @Quantidade, @ValorVenda, GETDATE())`;
                await executeQuery(query, [
                    { name: 'ClienteId', type: sql.Int, value: ClienteId },
                    { name: 'ProdutoId', type: sql.Int, value: ProdutoId },
                    { name: 'Quantidade', type: sql.Int, value: Quantidade },
                    { name: 'ValorVenda', type: sql.Float, value: ValorVenda },
                ]);
                res.status(201).send('Venda registrada com sucesso!');
            } catch (error) {
                console.error('Erro ao registrar venda:', error);
                res.status(500).send('Erro ao registrar venda.');
            }
        });

        // Listar Vendas
        app.get('/sales', async (req, res) => {
            try {
                const query = `SELECT Vendas.Id, Vendas.ClienteId, Vendas.ProdutoId, 
                                      Clientes.Nome AS Cliente, Produtos.Nome AS Produto,
                                      Vendas.Quantidade, Vendas.ValorVenda, Vendas.DataVenda
                               FROM Vendas
                               INNER JOIN Clientes ON Vendas.ClienteId = Clientes.Id
                               INNER JOIN Produtos ON Vendas.ProdutoId = Produtos.Id
                               ORDER BY Vendas.DataVenda DESC`;
                const result = await executeQuery(query);
                res.status(200).json(result.recordset);
            } catch (error) {
                console.error('Erro ao buscar vendas:', error);
                res.status(500).send('Erro ao buscar vendas.');
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

        // Iniciar o servidor
        app.listen(4000, () => console.log('Servidor rodando na porta 4000!'));
    })
    .catch(error => console.error('Erro ao conectar ao banco de dados:', error));