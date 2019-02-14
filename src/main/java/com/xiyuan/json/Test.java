package com.xiyuan.json;

import com.xiyuan.json.util.MapUtil;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

/**
 * Created by xiyuan_fengyu on 2019/2/14 10:51.
 */
public class Test {

    public static void main(String[] args) {
        String testJson = JsonTemplate.readFromResource("test.json");
        Map<String, Object> params = MapUtil.putter(new HashMap<String, Object>())
                .put("someMap", MapUtil.putter(new HashMap<>()).put("min", 1).put("max", 10).get())
                .put("someArray", Arrays.asList(1, 2, 3))
                .get();
        String res = JsonTemplate.fill(testJson, params);
        System.out.println(res);
    }

}
