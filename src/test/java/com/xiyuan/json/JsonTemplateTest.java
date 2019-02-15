package com.xiyuan.json;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import org.junit.Test;

import java.util.Map;
import java.util.Objects;

/**
 * Created by xiyuan_fengyu on 2019/2/14 10:51.
 */
public class JsonTemplateTest {

    private static final Gson gson = new GsonBuilder()
            .serializeNulls()
            .disableHtmlEscaping()
            .setPrettyPrinting()
            .create();

    @SuppressWarnings("unchecked")
    private static void executeTest(String path) {
        String template = JsonTemplate.readFromResource(path + "template.json");
        String dataStr = JsonTemplate.readFromResource(path + "data.json");
        Map<String, Object> data = gson.fromJson(dataStr, Map.class);
        String expectedResult = JsonTemplate.readFromResource(path + "result.json");

        String result = JsonTemplate.fill(template, data);
        assert(Objects.equals(expectedResult, result));
        System.out.println(path + "\ntemplate:\n" + template + "\ndata:\n" + dataStr + "\nresult:\n" + result + "\n\n\n");
    }

    @Test
    public void test() {
//        executeTest("tests/0/");
//        executeTest("tests/1/");
//        executeTest("tests/2/");
//        executeTest("tests/3/");
//        executeTest("tests/4/");
//        executeTest("tests/5/");
//        executeTest("tests/6/");
        executeTest("tests/7/");
    }

}
