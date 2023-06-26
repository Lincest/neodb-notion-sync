import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import axios from 'axios';
import { newEntryToDatabase, updateEntryToDatabase } from "./notion.js";

const token = process.env.NEODB_TOKEN;

const headers = {
    accept: 'application/json',
    Authorization: 'Bearer ' + token,
};

export const fetchUserInfo = () => {
    const options = {
        method: 'GET',
        url: 'https://neodb.social/api/me',
        headers,
    };
    axios
        .request(options)
        .then(function (response) {
            console.log(response.data);
        })
        .catch(function (error) {
            console.error(error);
        });
}

export const fetchCompletedFilmsAndSync = async (update = false) => {
    const options = {
        method: 'GET',
        url: 'https://neodb.social/api/me/shelf/complete',
        headers,
        params: {
            category: 'movie',
            page: 1,
        }
    }
    const completedFilms = [];
    const pre = await axios.request(options);
    const pages = pre.data.pages;
    // request all pages and sync them to notion
    const movieSet = getNamespaceByType('movie');
    console.log(`count = ${movieSet.size}, movieSet: `, movieSet);
    for (let i = 1; i <= pages; i++) {
        const op = { ...options };
        op.params.page = i;
        const res = await axios.request(op);
        const data = res.data.data;
        console.log(`syncing ${data.length} items...`);
        for (const dataItem of data) {
            const item = dataItem.item;
            if (!movieSet.has(item.title)) {
                const body = {
                    name: item.title,
                    type: 'Film',
                    status: 'Done', // Not started, In progress, Done
                    score: dataItem.rating_grade ? dataItem.rating_grade : 0,
                    comment: dataItem.comment_text ? dataItem.comment_text : '',
                    link: "https://neodb.social" + item.url,
                    completed: dataItem.created_time.split("T")[0],
                };
                console.log(`syncing: ${item.title}, body = `, body);
                try {
                    const pageId = await newEntryToDatabase(body);
                    console.log("sync completed: ", pageId);
                    movieSet.set(item.title, pageId);
                    completedFilms.push(body);
                } catch (error) {
                    console.log(`sync ${item.title} failed!`);
                }
            }
            if (update === true && movieSet.has(item.title)) {
                const body = {
                    name: item.title,
                    type: 'Film',
                    status: 'Done', // Not started, In progress, Done
                    score: dataItem.rating_grade ? dataItem.rating_grade : 0,
                    comment: dataItem.comment_text ? dataItem.comment_text : '',
                    link: "https://neodb.social" + item.url,
                    completed: dataItem.created_time.split("T")[0],
                };
                console.log(`updating: ${item.title}, body = `, body);
                try {
                    const pageId = await updateEntryToDatabase(movieSet.get(item.title), body);
                    console.log("update completed: ", pageId);
                    movieSet.set(item.title, pageId);
                    completedFilms.push(body);
                } catch (error) {
                    console.log(`update ${item.title} failed!`);
                }
            }
        }
    }
    console.log("movieSet = ", movieSet);
    // writeback movieSet
    writeNamespaceByType('movie', movieSet);
    console.log("sync movie completed");
}


// map: 名称:pageId
export const getNamespaceByType = (type) => {
    // check type should be book, tv, music, game, podcast, movie
    if (!(type === 'book' || type === 'tv' || type === 'music' || type === 'game' || type === 'podcast' || type === 'movie')) {
        console.error("Type should be book, tv, music, game, podcast, movie");
    }
    const csvData = fs.readFileSync(`./data/${type}.csv`, 'utf8');
    const rows = csvData.split('\n');
    const dataSet = new Map();
    rows.forEach(row => {
        const values = row.split(',');
        if (values.length === 2) {
            dataSet.set(values[0].trim(), values[1].trim());
        }
    });
    console.log("get namespace by type: ", type);
    return dataSet;
}

// write to csv file
export const writeNamespaceByType = (type, dataSet) => {
    // check type should be book, tv, music, game, podcast, movie
    if (!(type === 'book' || type === 'tv' || type === 'music' || type === 'game' || type === 'podcast' || type === 'movie')) {
        console.error("Type should be book, tv, music, game, podcast, movie");
    }
    let csvData = "";
    Array.from(dataSet).forEach(item => {
        csvData += `${item[0]},${item[1]}\n`
    })
    console.log(csvData);
    fs.writeFileSync(`./data/${type}.csv`, csvData);
    console.log(`Data written to ${type}.csv`);
}

fetchCompletedFilmsAndSync();