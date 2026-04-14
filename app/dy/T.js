/**
 * 中英文翻译文件
 */

let TT = {
    '首页': { 'en': 'Home' },
}

function T(title) {
    let lang = System.getLocaleInfo().language;
    if (lang == 'zh') {
        return title;
    }

    if (!TT[title] || !TT[title]['en']) {
        return title;
    }

    return TT[title]['en'];
}

module.exports = T;
