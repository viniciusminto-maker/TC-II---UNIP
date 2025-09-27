const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sql = require('mssql');

// Configuração do banco de dados
const dbConfig = {
    user: 'sa',
    password: 'Vini2609@',
    server: 'localhost',
    database: 'FIND_COST_TO_SELL',
    options: {
        encrypt: false, // Sem criptografia no desenvolvimento local
        trustServerCertificate: false, // Para certificados locais
    },
};

// Inicializar o servidor
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Conexão com o banco de dados
sql.connect(dbConfig)
    .then(pool => {
        console.log('Conexão com o banco de dados estabelecida!');

        // Função para executar consultas SQL
        const executeQuery = async (query, params = []) => {
            const request = pool.request();
            params.forEach(p => request.input(p.name, p.type, p.value));
            return await request.query(query);
        };

        // 📌 **Rotas de Clientes**
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

        // 📌 **Rotas de Produtos**
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

        // 📌 **Rotas de Vendas**
        // Registrar Venda
        app.post('/sales', async (req, res) => {
            const { ClienteId, ProdutoId, Quantidade } = req.body;

            try {
                const productQuery = 'SELECT Preco FROM Produtos WHERE Id = @ProdutoId';
                const productResult = await executeQuery(productQuery, [
                    { name: 'ProdutoId', type: sql.Int, value: ProdutoId },
                ]);

                if (!productResult.recordset.length) {
                    return res.status(404).send('Produto não encontrado.');
                }

                const Preco = productResult.recordset[0].Preco;
                const ValorVenda = Quantidade * Preco;

                const query = `INSERT INTO Vendas (ClienteId, ProdutoId, Quantidade, ValorVenda)
                               VALUES (@ClienteId, @ProdutoId, @Quantidade, @ValorVenda)`;
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
                const query = `SELECT Vendas.Id, Clientes.Nome AS Cliente, Produtos.Nome AS Produto,
                                      Vendas.Quantidade, Vendas.ValorVenda
                               FROM Vendas
                               INNER JOIN Clientes ON Vendas.ClienteId = Clientes.Id
                               INNER JOIN Produtos ON Vendas.ProdutoId = Produtos.Id`;
                const result = await executeQuery(query);
                res.status(200).json(result.recordset);
            } catch (error) {
                console.error('Erro ao buscar vendas:', error);
                res.status(500).send('Erro ao buscar vendas.');
            }
        });

        // Iniciar o servidor
        app.listen(4000, () => console.log('Servidor rodando na porta 4000!'));
    })
    .catch(error => console.error('Erro ao conectar ao banco de dados:', error));
