(() => {
    "use strict";

    const globalCtx = typeof global === "undefined" ? this : global;

    const ignoreObj = undefined;

    const flatArrays = [];

    function markAsFlatArray(arr) {
        flatArrays.push(arr);
        return arr;
    }

    function isFlatArray(obj) {
        return obj instanceof Array && flatArrays.indexOf(obj) > -1;
    }

    function $(str) {
        try {
            return eval(str);
        }
        catch (e) {
            return undefined;
        }
    }

    function _(str) {
        try {
            return eval(str) != null;
        }
        catch (e) {
            return false;
        }
    }

    function evalWithCtx(ctx, str) {
        str = str.trim();
        if (str.startsWith("{") && str.endsWith("}")) {
            str = "(" + str + ")";
        }
        else if (str.startsWith("[") && str.endsWith("]")) {
            str = "(" + str + ")";
        }

        // 存储环境旧值
        const oldValues = {};
        for (let key of Object.keys(ctx)) {
            const oldV = globalCtx[key];
            const newV = ctx[key];
            if (oldV !== newV) {
                globalCtx[key] = newV;
                oldValues[key] = oldV;
            }
        }
        // 计算表达式
        const res = eval(str);
        // 恢复环境旧值
        for (let key of Object.keys(oldValues)) {
            const oldValue = oldValues[key];
            if (oldValue === undefined) {
                delete globalCtx[key];
            }
            else {
                globalCtx[key] = oldValue;
            }
        }
        return res;
    }

    function copyCtx(ctx) {
        const newCtx = {};
        Object.assign(newCtx, ctx);
        return newCtx;
    }

    function defineValue(name, valueExp, ctx) {
        ctx[name] = fill(valueExp, ctx);
    }

    function fill(template, ctx) {
        if (template instanceof Array) {
            return fillArray(template, ctx);
        }
        else {
            const itemType = typeof template;
            if (itemType === "object") {
                return fillObj(template, ctx);
            }
            else if (itemType === "string") {
                return fillStr(template, ctx);
            }
            else {
                return template;
            }
        }
    }

    const specialKeys = [
        {
            type: "if",
            reg: /^if *\((.*)\)$/
        },
        {
            type: "else if",
            reg: /^else if *\((.*)\)$/
        },
        {
            type: "else",
            reg: /^else$/
        },
        {
            type: "for",
            reg: /^for *\((.+), *(.+)\) *of +(.*)$/
        },
        {
            type: "flatArray",
            reg: /^flatArray(\((\(.+, *.+\) *=> *.+)\))?$/
        },
        {
            type: "flatMap",
            reg: /^flatMap(\((\(.+, *.+\) *=> *.+)\))?$/
        },
        {
            type: "set",
            reg: /^set\((.+)\)$/
        },
        {
            type: "exp",
            reg: /^(.+)$/
        }
    ];

    function fillObj(template, ctx) {
        const keyValues = [];
        for (let key of Object.keys(template)) {
            if (key.startsWith("#{") && key.endsWith("}")) {
                const str = key.substring(2, key.length - 1).trim();
                for (let specialKey of specialKeys) {
                    const mRes = specialKey.reg.exec(str);
                    if (mRes) {
                        keyValues.push({
                            type: specialKey.type,
                            raw: key,
                            match: mRes,
                            value: template[key]
                        });
                        break;
                    }
                }
            }
            else if (key.startsWith("${") && key.endsWith("}")) {
                keyValues.push({
                    type: "raw",
                    raw: key,
                    key: key.substring(2, key.length - 1),
                    value: template[key]
                });
            }
            else {
                keyValues.push({
                    type: "raw",
                    raw: key,
                    key: key,
                    value: template[key]
                });
            }
        }
        return fillKeyValues(template, keyValues, ctx);
    }

    /**
     * 检测键值组合是否符合规范
     */
    function fillKeyValues(template, keyValues, ctx) {
        // set 可以和其他所有键值搭配
        // if, else if, else 只能和 set 搭配
        // for 只能和 set 搭配
        // flatArray 只能和 set 搭配
        // flatMap 可以和 set，除（if, else if, else, for, flatArray）以外的所有键搭配
        let ifN = 0;
        let elseIfN = 0;
        let elseN = 0;
        let forN = 0;
        let flatArrayN = 0;
        let flatMapN = 0;
        let setN = 0;
        let expN = 0;
        let rawN = 0;
        for (let keyVal of keyValues) {
            if (keyVal.type === "raw") {
                rawN++;
            }
            else if (keyVal.type === "set") {
                setN++;
            }
            else if (keyVal.type === "exp") {
                expN++;
            }
            else if (keyVal.type === "if") {
                ifN++;
                if (ifN > 1) {
                    throw new Error("只能有一个 if: " + keyVal.raw);
                }
                else if (elseIfN > 0) {
                    throw new Error("else if 只能在 if 后使用: " + keyVal.raw);
                }
                else if (elseN > 0) {
                    throw new Error("else 只能在 if 后使用: " + keyVal.raw);
                }
            }
            else if (keyVal.type === "else if") {
                elseIfN++;
                if (elseN > 0) {
                    throw new Error("else 不只能在 else if 之前使用: " + keyVal.raw);
                }
            }
            else if (keyVal.type === "else") {
                elseN++;
                if (elseN > 1) {
                    throw new Error("只能有一个 else: " + keyVal.raw);
                }
            }
            else if (keyVal.type === "for") {
                forN++;
                if (forN > 1) {
                    throw new Error("只能有一个 for: " + keyVal.raw);
                }
            }
            else if (keyVal.type === "flatArray") {
                flatArrayN++;
                if (flatArrayN > 1) {
                    throw new Error("只能有一个 flatArray: " + keyVal.raw);
                }
            }
            else if (keyVal.type === "flatMap") {
                flatMapN++;
            }
        }

        if (ifN + elseIfN + elseN > 0) {
            if (forN + flatArrayN + flatMapN + expN + rawN > 0) {
                throw new Error("if, else if, else 只能和 set 搭配: " + JSON.stringify(template, null, 4));
            }
            else {
                return fillIfElse(template, keyValues, ctx);
            }
        }
        else if (forN > 0) {
            if (ifN + elseIfN + elseN + flatArrayN + flatMapN + expN + rawN > 0) {
                throw new Error("for 只能和 set 搭配: " + JSON.stringify(template, null, 4));
            }
            else {
                return fillFor(template, keyValues, ctx);
            }
        }
        else if (flatArrayN > 0) {
            if (ifN + elseIfN + elseN + forN + flatMapN + expN + rawN > 0) {
                throw new Error("flatArray 只能和 set 搭配: " + JSON.stringify(template, null, 4));
            }
            else {
                return fillFlatArray(template, keyValues, ctx);
            }
        }
        else if (flatMapN > 0) {
            if (ifN + elseIfN + elseN + forN + flatArrayN > 0) {
                throw new Error("flatMap 只能和 set, flatMap, 普通键 搭配: " + JSON.stringify(template, null, 4));
            }
            else {
                return fillMap(template, keyValues, ctx);
            }
        }
        else if (expN > 0 || rawN > 0) {
            return fillMap(template, keyValues, ctx);
        }
    }

    function fillIfElse(template, keyValues, ctx) {
        for (let keyVal of keyValues) {
            if (keyVal.type === "set") {
                defineValue(keyVal.match[1], keyVal.value, ctx);
            }
            else if (keyVal.type === "if" || keyVal.type === "else if") {
                if (evalWithCtx(ctx, keyVal.match[1])) {
                    return fill(keyVal.value, copyCtx(ctx));
                }
            }
            else {
                return fill(keyVal.value, copyCtx(ctx));
            }
        }
        return ignoreObj;
    }

    function fillFor(template, keyValues, ctx) {
        const res = [];
        for (let keyVal of keyValues) {
            if (keyVal.type === "set") {
                defineValue(keyVal.match[1], keyVal.value, ctx);
            }
            else if (keyVal.type === "for") {
                const indexOrKeyName = keyVal.match[1];
                const itemName = keyVal.match[2];
                const sourceExp = keyVal.match[3];
                const source = evalWithCtx(ctx, sourceExp);
                const valueExp = keyVal.value;
                if (source instanceof Array) {
                    for (let i = 0, len = source.length; i < len; i++) {
                        const subCtx = copyCtx(ctx);
                        subCtx[indexOrKeyName] = i;
                        subCtx[itemName] = source[i];
                        const subRes = fill(valueExp, subCtx);
                        if (subRes !== ignoreObj) {
                            res.push(subRes);
                        }
                    }
                }
                else if (typeof source === "object") {
                    const sKeys = Object.keys(source);
                    for (let i = 0, len = sKeys.length; i < len; i++) {
                        const sKey = sKeys[i];
                        const subCtx = copyCtx(ctx);
                        subCtx[indexOrKeyName] = sKey;
                        subCtx[itemName] = source[sKey];
                        const subRes = fill(valueExp, subCtx);
                        if (subRes !== ignoreObj) {
                            res.push(subRes);
                        }
                    }
                }
                else {
                    throw new Error("解析template失败：\n"
                        + JSON.stringify(template, null, 4) + "\n"
                        + "用于 for 解析的目标不是一个数组或对象：" + JSON.stringify(source));
                }
            }
        }
        return res;
    }

    function fillFlatArray(template, keyValues, ctx) {
        const res = [];
        for (let keyVal of keyValues) {
            if (keyVal.type === "set") {
                defineValue(keyVal.match[1], keyVal.value, ctx);
            }
            else if (keyVal.type === "flatArray") {
                const valueExp = keyVal.value;
                const value = fill(valueExp, ctx);
                if (value !== ignoreObj) {
                    const checkFunStr = keyVal.match[2];
                    const checkFun = checkFunStr != null ? evalWithCtx(ctx, checkFunStr) : true;
                    if (value instanceof Array) {
                        value.forEach((item, index) => {
                            if (checkFun === true || checkFun(index, item)) {
                                res.push(item);
                            }
                        });
                    }
                    else {
                        throw new Error("解析template失败：\n"
                            + JSON.stringify(template, null, 4) + "\n"
                            + "用于 flatMap 解析的目标不是一个数组：" + JSON.stringify(value));
                    }
                }
            }
        }
        return markAsFlatArray(res);
    }

    function fillMap(template, keyValues, ctx) {
        const res = {};
        for (let keyVal of keyValues) {
            if (keyVal.type === "set") {
                defineValue(keyVal.match[1], keyVal.value, ctx);
            }
            else if (keyVal.type === "flatMap") {
                const valueExp = keyVal.value;
                const value = fill(valueExp, ctx);
                if (value !== ignoreObj) {
                    const checkFunStr = keyVal.match[2];
                    const checkFun = checkFunStr != null ? evalWithCtx(ctx, checkFunStr) : true;
                    if (typeof value === "object") {
                        for (let key of Object.keys(value)) {
                            const val = value[key];
                            if (checkFun === true || checkFun(key, val)) {
                                res[key] = val;
                            }
                        }
                    }
                    else {
                        throw new Error("解析template失败：\n"
                            + JSON.stringify(template, null, 4) + "\n"
                            + "用于 flatMap 解析的目标不是一个对象：" + JSON.stringify(value));
                    }
                }
            }
            else if (keyVal.type === "exp") {
                const key = evalWithCtx(ctx, keyVal.match[1]);
                if (key != null) {
                    const subRes = fill(keyVal.value, copyCtx(ctx));
                    if (subRes !== ignoreObj) {
                        res["" + key] = subRes;
                    }
                }
            }
            else if (keyVal.type === "raw") {
                const subRes = fill(keyVal.value, copyCtx(ctx));
                if (subRes !== ignoreObj) {
                    res[keyVal.key] = subRes;
                }
            }
        }
        return res;
    }

    function fillArray(template, ctx) {
        const newArr = [];
        for (let i = 0, len = template.length; i < len; i++) {
            let item = template[i];
            if (item instanceof Array) {
                const subNewArr = fillArray(item, copyCtx(ctx));
                newArr.push(subNewArr);
            }
            else {
                const subNewObj = fill(item, copyCtx(ctx));
                if (subNewObj !== ignoreObj) {
                    if (isFlatArray(subNewObj)) {
                        for (let subItem of subNewObj) {
                            if (subItem !== ignoreObj) {
                                newArr.push(subItem);
                            }
                        }
                    }
                    else {
                        newArr.push(subNewObj);
                    }
                }
            }
        }
        return newArr;
    }

    function fillStr(template, ctx) {
        if (template.startsWith("#{") && template.endsWith("}")) {
            const valueExp = template.substring(2, template.length - 1);
            return evalWithCtx(ctx, valueExp);
        }
        else if (template.startsWith("${") && template.endsWith("}")) {
            return template.substring(2, template.length - 1);
        }
        else {
            return template;
        }
    }

    function fillTemplateStr(templateStr, ctx) {
        const res = JSON.stringify(fill(JSON.parse(templateStr), ctx), null, 4);
        if (flatArrays.length > 0) {
            flatArrays.splice(0, flatArrays.length);
        }
        return res;
    }

    // test
    if (typeof __release__ === "undefined") {
        const template = `
{
  "\${#{rawStr}}": "\${\${test raw str}}",
  "exp_test": {
    "#{someMap.min != null ? '$gte' : null}": "#{someMap.min}",
    "#{someMap.max != null ? '$lte' : null}": "#{someMap.max}"
  },
  "#{set(testSetVar)}": "#{'just test ' + 123}",
  "#{testSetVar + ' key'}": "#{testSetVar + ' value'}",
  "random": "#{parseInt('' + Math.random() * 1000)}",
  "test if": {
    "#{if (someMap.min < 5)}": "someMap.min < 5",
    "#{else if (someMap.min == 5)}": "someMap.min == 5",
    "#{else}": "someMap.min > 5"
  },
  "for_array": {
    "#{for (index, item) of someArray}": {
      "#{if (index % 2 == 0)}": "#{index + '_' + item}"
    }
  },
  "for_map": {
    "#{for (key, value) of {'id': 123, 'name': 'Tom'}}": {
      "#{key}": "#{value}"
    }
  },
  "#{flatMap((key, value) => key.match('id|name'))}": {
    "id": 123,
    "name": "Tom",
    "age": 15
  },
  "testFlatArray": [
    1,
    2,
    {
      "#{set(temp)}": "#{'' + new Date()}",
      "#{flatArray}": [3, 4, 5, "#{testSetVar}", "#{temp}"]
    },
    6,
    "#{$('notDefinedVar')}"
  ]
}
`;
        const res = fillTemplateStr(template, {
            someMap: {min: 1, max: 10},
            someArray: [1, 2, 3]
        });
        console.log(res);
    }

    return fillTemplateStr;
})();
