const { findByIdAndUpdate } = require('../model/Article')
const Article = require('../model/Article')
const validateArticleInput = require('../validation/article')

/**
 * @route GET api/articles/test
 * @desc  测试
 * @access 接口是公开的
 */
exports.Test = async ctx => {
    ctx.body = { msg: 'articles succeed ...' }
}

/**
 * @route GET api/articles/article?:id
 * @desc  查看单个文章
 * @access 接口是公开的
 */
exports.GetArticle = async ctx => {
    const id = ctx.query.id
    await Article.findById(id)
    .then(item => {
        ctx.status = 200
        ctx.body = { success: true, data: item}
      })
      .catch(err => {
        ctx.status = 404
        ctx.body = { success: false, msg: '文章不存在'}
      })
}

/**
 * @route GET api/articles/articles
 * @desc  查看全部文章
 * @access 接口是公开的
 */
exports.GetArticles = async ctx => {
    ctx.body = ctx.advancedResults
}

/**
 * @route POST api/articles/article
 * @desc  创建文章
 * @access 接口是私有的
 */
exports.CreateArticle = async ctx => {
    const body = ctx.request.body
    const { error, isValid } = validateArticleInput(body)
    if (!isValid) {
        ctx.status = 400
        ctx.body = error
        return
    }

    const articleInfo = {}

    if (body.title) {
        articleInfo.title = body.title
    }
    if (body.content) {
        articleInfo.content = body.content
    }
    if (body.type) {
        articleInfo.type = body.type
    }
    articleInfo.user = ctx.state.user._id

    // 创建缓存
    const article = new Article(articleInfo)

    await article.save().then(article => {
        ctx.status = 200
        ctx.body = { success: true, data: article}
    }).catch(err => {
        ctx.status = 400
        ctx.body = { success: false, msg: '创建文章失败'}
    })
}

/**
 * @route PUT api/articles/article?:id
 * @desc  修改文章
 * @access 接口是私有的
 */
exports.UpdateArticle = async ctx => {
    const id = ctx.query.id
    const body = ctx.request.body

    const { error, isValid } = validateArticleInput(body)
    if (!isValid) {
        ctx.status = 400
        ctx.body = error
        return
    }

    // 判断文章是否存在
    try {
        const cheackArticle = await Article.findById(id)
        if (cheackArticle) {
            const articleInfo = {}

            if (body.title) {
                articleInfo.title = body.title
            }
            if (body.content) {
                articleInfo.content = body.content
            }
            if (body.type) {
                articleInfo.type = body.type
            }
            articleInfo.user = ctx.state.user._id

            const updateArticle = await Article.findByIdAndUpdate(
                {_id: id},
                {$set: articleInfo},
                {new: true}
            )
            ctx.body = { success: true, data: updateArticle }
        } 

    } catch (error) {
        ctx.status = 404
        ctx.body = { success: false, msg: '文章不存在'}
    }
}

/**
 * @route POST api/articles/like?:id
 * @desc  点赞与取消点赞
 * @access 接口是私有的
 */
exports.ToggleLike = async ctx => {
    const id = ctx.query.id
    const user = ctx.state.user
    // 判断文章是否存在
    try {
        const article = await Article.findById(id)
        if (article) {
            // 判断点赞还是取消点赞
            // 判断是否有 相同id 的下表
            const removeIndex = article.like.map(item => item.user.toString()).indexOf(article.user)
            if (removeIndex < 0) {
                // 点赞
                article.like.unshift({user: user._id})
                const updateArticle = await Article.findByIdAndUpdate(
                    {_id: id},
                    {$set: article},
                    {new: true}
                )
                ctx.body = {success: true, data: updateArticle}
            } else {
                // 具备该下标 取消点赞
                article.like.splice(removeIndex, 1)
                const updateArticle = await Article.findByIdAndUpdate(
                    {_id: id},
                    {$set: article},
                    {new: true}
                )
                ctx.body = {success: true, data: updateArticle}
            }
        }
    } catch (error) {
        ctx.status = 404
        ctx.body = { success: false, msg: '文章不存在'}
        console.log(error)
    }
}