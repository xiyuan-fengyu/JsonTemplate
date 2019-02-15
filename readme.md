# JsonTemplate
使用 json模板 + 参数，动态解析为新的 json 数据  
不同的平台，需要在 pom.xml 中修改使用对应的 j2v8 包  

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
各种语法的例子可以在 src/test/resources/tests 目录下找到  

### ${}
直接以括号中的字符串作为值
例如
模板
```
{
    "${some raw string}": "${#{this is not a exp}}",
    "${1 + 2}": "${${this is not a exp}}"
}
```
参数
```
{}
```
解析后
```
{
    "some raw string": "#{this is not a exp}",
    "1 + 2": "${this is not a exp}"
}
```

### #{exp}
exp 会通过js eval计算出当前上下文情况下的值
作为 key时，如果计算结果为null，直接忽略这个键，不计算value
exp 中可以通过 $(expStr) 来尝试获取 expStr 执行后的值，如果执行报错，返回 undefined
exp 中可以通过 _(expStr) 来尝试获取 expStr 执行后的值是否不为 null 或 undefined，如果执行报错，返回 false
```
{
    "id": "#{id}",
    "name": "#{name}",
    "sex": "#{$('sex') === 'girl' ? 0 : 1}",
    "#{_('phone') ? 'phone' : null}": "#{phone}"
}
```
参数
```
{
    "id": 1,
    "name": "Jin",
    "sex": "girl",
    "phone": "18912345678"
}
```
解析后
```
{
    "id": 1,
    "name": "Jin",
    "sex": 0,
    "phone": "18912345678"
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
遍历array或map，生成一个数组
模板
```
{
    "#{for (index, value) of arr}": {
        "index": "#{index}",
        "value": "#{value}"
    }
}
```
参数
```
{
    "arr": [
        "a",
        "b"
    ]
}
```
解析后
```
[
    {
        "index": 0,
        "value": "a"
    },
    {
        "index": 1,
        "value": "b"
    }
]
```

### #{flatArray}, #{flatArray((index, value) => bool)}
将一个数组中的元素展开到外层数组中，如果外层不是数组，则没有展开效果
模板
```
[
    0,
    1,
    {
        "#{flatArray((index, value) => value % 2 === 0)}": [2, 3, 4]
    },
    5
]
```
参数
```
{}
```
解析后
```
[
    0,
    1,
    2,
    4,
    5
]
```

### #{flatMap}, #{flatMap((key, value) => bool)}
将map中的键值展开到key所在的map中
模板
```
{
    "id": 1,
    "#{flatMap}": "#{user}",
    "version": 0
}
```
参数
```
{
    "user": {
        "name": "Tom",
        "age": 25,
        "sex": "boy"
    }
}
```
解析后
```
{
    "id": 1,
    "name": "Tom",
    "age": 25,
    "sex": "boy",
    "version": 0
}
```

### #{set(name)}
在当前上下文范围内定义一个临时变量





