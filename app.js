const express = require('express')
const axios = require("axios");
const HTMLParser = require('node-html-parser');
const app = express();
const port = 5000;
const cors = require('cors');

async function parse(query, keyFilter) {
    let url = "https://www.dissercat.com/search?q=";
    const diserts = [];
    let page = 1;

    for (let i = 1; i <= page; i++) {
        let _url = url + query;

        if (i > 1) {
            _url = _url + '&page=' + i;
        }

        const res = await axios.get(_url)

        if (res?.data) {
            const document = HTMLParser.parse(res.data);
            const searchResults = document.querySelectorAll('.search-result');

            searchResults.forEach((element) => {
                const disert = {};

                disert.title = element.querySelector('a').textContent;
                disert.keyWords = element.querySelector('a').getElementsByTagName('strong').map(strongMap);

                const infoArr = element.querySelector('h3 > span').innerHTML.split(' &mdash; ');
                disert.year = infoArr[0];
                disert.author = infoArr[1];

                if (keyFilter && disert.keyWords.length > 1) {
                    diserts.push(disert);
                }

                if (!keyFilter) {
                    diserts.push(disert);
                }

            });

            page = getLastPage(document);

            await delay();
        }
    }

    return diserts
}

function getLastPage(document) {
    const pages = document.querySelectorAll('.page-item').map(pageMap).filter(pageFilter)
    const lastPage = Math.max(...pages);

    if (lastPage > 1) {
        return lastPage;
    }

    return 1;
}

function pageMap(element) {
    return parseInt(element.textContent, 10)
}

function pageFilter(page) {
    return !isNaN(page)
}

function strongMap(strong) {
    return strong.textContent;
}

function delay() {
    return new Promise(resolve => setTimeout(resolve, 500));
}

app.use(cors({origin:'*'}))
app.get('/', async (req, res) => {

    const query = encodeURI(`${req.query.q}`.trim())
    const keyFilter = req.query.keyFilter ? JSON.parse(req.query.keyFilter) : false
    try {
        const result = await parse(query, keyFilter)
        res.json(JSON.stringify(result))
    } catch (e) {
        res.status(500).send(e)
    }
})

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})
