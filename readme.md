# JsonTemplate
使用 json模板 + 参数，动态解析为新的 json 数据  

## 例子
json 模板
```json
{
  "${#{rawStr}}": "${${test raw str}}",
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
    6
  ]
}
```
参数：
```json
{
    "someMap": {"min": 1, "max": 10},
    "someArray": [1, 2, 3]
}
```
解析结果：
```
{
    "#{rawStr}": "${test raw str}",
    "exp_test": {
        "$gte": 1,
        "$lte": 10
    },
    "just test 123 key": "just test 123 value",
    "random": 740,
    "test if": "someMap.min < 5",
    "for_array": [
        "0_1",
        "2_3"
    ],
    "for_map": [
        {
            "id": 123
        },
        {
            "name": "Tom"
        }
    ],
    "id": 123,
    "name": "Tom",
    "testFlatArray": [
        1,
        2,
        3,
        4,
        5,
        "just test 123",
        "Thu Feb 14 2019 18:44:28 GMT+0800 (中国标准时间)",
        6
    ]
}
```

## 语法
### ${}
直接以括号中的字符串作为值
例如
```
{
    "${test}": "123"
}
```
解析后
```
{
    "test": "123"
}
```

### #{exp}
exp 会通过js eval计算出当前上下文情况下的值
如果作为 key时，值为null，直接忽略这个键，不计算value

```
{
    "#{user.id ? 'id' : null}": "#{'id_' + user.id}",
    "#{user.name ? 'name' : null}": "#{user.name}",
    "sex": "#{user.sex === 0 ? 'boy' : 'girl'}"
}
```
参数
```
{
    "user": {
        "id": 123,
        "sex": 0
    }
}
```
解析后
```
{
    "id": "id_123",
    "sex": "boy"
}
```

### #{if (con)}, #{else if (con)}, #{else}
```
{
    "#{if (age <= 18)}": "少年",
    "#{else if (age <= 35)}": "青年",
    "#{else if (age <= 55)}": "中年",
    "#{else}": "老年"
}
```
参数
```
{
    "age": 27 
}
```
解析后
```
"青年"
```

### #{for (keyOrIndex, value) of arrayOrMap}

### #{flatArray}, #{flatArray((index, value) => bool)}

### #{flatMap}, #{flatMap((key, value) => bool)}

### #{define(name)}





