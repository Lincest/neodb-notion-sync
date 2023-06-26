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

const fetchCompletedAndSync = async (type = 'movie', update = false) => {
    const options = {
        method: 'GET',
        url: 'https://neodb.social/api/me/shelf/complete',
        headers,
        params: {
            category: type,
            page: 1,
        }
    }
    const pre = await axios.request(options);
    const pages = pre.data.pages;
    // request all pages and sync them to notion
    const itemMap = getNamespaceByType(type);
    console.log(`count = ${itemMap.size}, itemMap: `, itemMap);
    for (let i = 1; i <= pages; i++) {
        const op = { ...options };
        op.params.page = i;
        const res = await axios.request(op);
        const data = res.data.data;
        console.log(`syncing ${data.length} items...`);
        for (const dataItem of data) {
            const item = dataItem.item;
            let pageType = ''; // Book, Article, TV Series, Film, Podcast, Music
            switch (type) {
                case 'book':
                    pageType = 'Book';
                    break;
                case 'movie':
                    pageType = 'Film';
                    break;
                case 'tv':
                    pageType = 'TV Series';
                    break;
                case 'music':
                    pageType = 'Music';
                    break;
                default:
                    break;
            }
            const body = {
                name: item.title,
                type: pageType,
                status: 'Done', // Not started, In progress, Done
                score: dataItem.rating_grade ? dataItem.rating_grade : 0,
                comment: dataItem.comment_text ? dataItem.comment_text : '',
                link: "https://neodb.social" + item.url,
                completed: dataItem.created_time.split("T")[0],
                tags: dataItem.tags,
            };
            if (!itemMap.has(item.title)) {
                console.log(`syncing: ${item.title}, body = `, body);
                try {
                    const pageId = await newEntryToDatabase(body);
                    console.log("sync completed: ", pageId);
                    itemMap.set(item.title, pageId);
                } catch (error) {
                    console.log(`sync ${item.title} failed!`);
                }
            } else {
                if (update === true && itemMap.has(item.title)) {
                    console.log(`updating: ${item.title}, body = `, body);
                    try {
                        const pageId = await updateEntryToDatabase(itemMap.get(item.title), body);
                        console.log("update completed: ", pageId);
                        itemMap.set(item.title, pageId);
                    } catch (error) {
                        console.log(`update ${item.title} failed!`);
                    }
                }
            }
        }
    }
    console.log("itemMap = ", itemMap);
    // writeback itemMap
    writeNamespaceByType(type, itemMap);
    console.log(`sync ${type} completed`);
}

export const fetchCompletedMovieAndSync = async (update = false) => {
    await fetchCompletedAndSync('movie', update);
}

export const fetchCompletedTvAndSync = async (update = false) => {
    await fetchCompletedAndSync('tv', update);
}

export const fetchCompletedMusicAndSync = async (update = false) => {
    await fetchCompletedAndSync('music', update);
}

export const fetchCompletedBookAndSync = async (update = false) => {
    await fetchCompletedAndSync('book', update);
}

// map: 名称:pageId
export const getNamespaceByType = (type) => {
    // check type should be book, tv, music, game, podcast, movie
    if (!(type === 'book' || type === 'tv' || type === 'music' || type === 'game' || type === 'podcast' || type === 'movie')) {
        console.error("Type should be book, tv, music, game, podcast, movie");
    }
    if (!fs.existsSync(`./data/${type}.csv`)) {
        return new Map();
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

// write to csv file: 名称:pageId
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

// TODO sync wishlist and progress (but I don't think it needs to be done cause those are not important and don't have comments and ratings)

