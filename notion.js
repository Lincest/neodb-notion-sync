// this will allow us to import our variable
import dotenv from "dotenv";
dotenv.config();
// the following lines are required to initialize a Notion client
import { Client } from "@notionhq/client";
// this line initializes the Notion Client using our key
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_API_DATABASE;
// util
import { inspect } from 'util';
import { resolveNaptr } from "dns";

// 获取数据库的属性
export const getDatabaseProperties = async () => {
    const database = await notion.databases.retrieve({ database_id: databaseId });
    console.log(inspect(database, { showHidden: false, depth: null, colors: true }))
};

// 获取数据库信息
export const getDatabase = async () => {
    const response = await notion.databases.query({ database_id: databaseId });
    console.log(inspect(response.results[2].properties, { showHidden: false, depth: null, colors: true }))
};

// 生成 neodb page
export const generateBody = (neodbItem) => {
    const { name, type, status, score, comment, link, completed, tags, cover } = neodbItem;
    return {
        parent: {
            database_id: databaseId,
        },
        properties: {
            Name: {
                title: [
                    {
                        text: {
                            content: name,
                        },
                    },
                ],
            },
            Type: {
                select: {
                    name: type, // Book, Article, TV Series, Film, Podcast, Music
                },
            },
            Status: {
                status: {
                    name: status, // Not started, In progress, Done
                },
            },
            Score: {
                number: score,
            },
            Comment: {
                rich_text: [
                    {
                        text: {
                            content: comment,
                        }
                    }
                ]
            },
            Link: {
                url: link,
            },
            Completed: { // completed is a date
                date: {
                    start: completed,
                }
            },
            Tags: {
                multi_select: tags.map(x => ({ name: x })),
            }
        },
        cover: {
            type: 'external',
            external: {
                url: cover ? cover : ''
            }
        }
    };
}

// 插入数据库
export const newEntryToDatabase = async (item) => {
    const body = generateBody(item);
    const response = await notion.pages.create(body);
    return response?.id;
}

// 更新数据库
export const updateEntryToDatabase = async (pageId, item) => {
    const body = generateBody(item);
    body.page_id = pageId;
    const response = await notion.pages.update(body);
    return response?.id;
}