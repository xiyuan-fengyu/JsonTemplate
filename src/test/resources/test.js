
function $(str) {
    try {
        return eval(str);
    }
    catch (e) {
        return undefined;
    }
}

console.log($("id"));


