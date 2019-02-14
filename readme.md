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
    someMap: {min: 1, max: 10},
    someArray: [1, 2, 3]
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
@TODO







