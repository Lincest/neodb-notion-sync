# sync neodb to notion

[my notion page](https://moreality.notion.site/1421d177c6ed4513ab692fd223863a7e?v=24dfebddf9ee4db388aee16bed85695d&pvs=25)  |  [neodb page](https://neodb.social/users/moreality@mastodon.social/)

![](https://youpai.roccoshi.top/img/202306261550602.png)

## 1 - create notion database: 

![](https://youpai.roccoshi.top/img/202306261508300.png)

all needed properties: 

- Name
- Type
- Status
- Score
- Comment
- Link
- Completed
- Tags

## 2 - set envs

```shell
touch .env
```

the `.env` should include: 

```shell
NOTION_API_KEY = secret_xxxxxx
NOTION_API_DATABASE = xxxxxxxxxxxxxxxxxxx
NEODB_TOKEN = xxxxxxxxxxxxxxxxxx
```

### where to get those envs?

- `NOTION_API_KEY`: [notion api](https://www.notion.so/my-integrations)
![](https://youpai.roccoshi.top/img/202306261528187.png)

- `NOTION_API_DATABASE`: 
```
https://www.notion.so/myworkspace/a8aec43384f447ed84390e8e42c2e089?v=...
                                  |--------- Database ID --------|
```
- `NEODB_TOKEN`: [https://neodb.social/developer/](https://neodb.social/developer/)
![](https://youpai.roccoshi.top/img/202306261527035.png)

## 3 - run

first change index.js to set what you want to sync, then: 

```shell
npm install
npm start
```

- `fetchCompletedXXXAndSync(false)` or `fetchCompletedXXXAndSync()`: 

Incremental Sync (use `./data/xxx.csv` to keep track of the last sync time)

- `fetchCompletedXXXAndSync(true)`

Full Sync (will create or update all data in notion database)