const str = 'Scanned page 1. (scanner status = 5)';
const matchregex = /Scanned page (\d+)/g;

const arr = matchregex.exec(str);
if (arr.length > 1) {
    arr[0][1];
}
console.log(arr);