const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3005;
const E_COMMERCE_API_URL = "http://20.244.56.144/test/companies";
const AUTH_TOKEN = 'your_actual_token_here'; 

const fetchProducts = async (company, category, n, minPrice, maxPrice) => {
    const url = `${E_COMMERCE_API_URL}/${company}/categories/${category}/products/top-${n}?minPrice=${minPrice}&maxPrice=${maxPrice}`;
    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching products from ${company}:`, error.message);
        return [];
    }
};

const sortAndPaginate = (products, sortBy, order, page, n) => {
    const sorted = products.sort((a, b) => {
        if (order === 'desc') {
            return b[sortBy] - a[sortBy];
        }
        return a[sortBy] - b[sortBy];
    });
    const startIndex = (page - 1) * n;
    return sorted.slice(startIndex, startIndex + n);
};

const generateUniqueId = (product, company) => {
    return `${company}-${product.productName}`;
};

app.get('/categories/:category/products', async (req, res) => {
    const { category } = req.params;
    const {
        n = 10,
        page = 1,
        minPrice = 0,
        maxPrice = 100000,
        sortBy = 'price',
        order = 'asc'
    } = req.query;

    try {
        const fetchPromises = E_COMMERCE_COMPANIES.map(c => fetchProducts(c, category, n, minPrice, maxPrice));
        const results = await Promise.all(fetchPromises);

        let products = results.flat().map((product) => ({ ...product, uniqueId: generateUniqueId(product, company) }));

        if (sortBy) {
            products = sortAndPaginate(products, sortBy, order, page, n);
        }

        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/categories/:category/products/:productId', async (req, res) => {
    const { category, productId } = req.params;

    try {
        const fetchPromises = E_COMMERCE_COMPANIES.map(c => fetchProducts(c, category, 10, 0, 100000));
        const results = await Promise.all(fetchPromises);

        const product = results.flat().find(p => generateUniqueId(p, company) === productId);

        if (product) {
            res.json(product);
        } else {
            res.status(404).send('Product not found');
        }
    } catch (error) {
        console.error('Error fetching product details:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
