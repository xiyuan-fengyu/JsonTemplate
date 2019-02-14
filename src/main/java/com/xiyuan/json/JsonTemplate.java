package com.xiyuan.json;

import com.eclipsesource.v8.V8;
import com.eclipsesource.v8.V8Array;
import com.eclipsesource.v8.V8Function;
import com.eclipsesource.v8.utils.V8ObjectUtils;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Created by xiyuan_fengyu on 2019/2/13 18:51.
 */
public class JsonTemplate {

    private static final V8 v8;

    private static final V8Function fillTemplateStr;

    static {
        String jsonTemplateJs = readFromResource("JsonTemplate.js");
        if (jsonTemplateJs == null) {
            throw new IllegalStateException("JsonTemplate.js is missing");
        }

        v8 = V8.createV8Runtime();
        v8.add("__release__", true);
        v8.registerJavaMethod((v8Object, v8Array) -> {
            StringBuilder builder = new StringBuilder();
            for (int i = 0, len = v8Array.length(); i < len; i++) {
                builder.append(v8Array.get(i));
                if (i + 1 != len) {
                    builder.append(", ");
                }
            }
            System.out.println(builder.toString());
        }, "print");
        fillTemplateStr = (V8Function) v8.executeScript(jsonTemplateJs, "JsonTemplate.js", 1);
    }

    public static String readFromResource(String path) {
        try (InputStream in = JsonTemplate.class.getClassLoader().getResourceAsStream(path)) {
            byte[] bytes = new byte[in.available()];
            if (in.read(bytes) > 0) {
                return new String(bytes, StandardCharsets.UTF_8);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    public static String fill(String template, Map<String, Object> params) {
        return (String) fillTemplateStr.call(null, new V8Array(v8).push(template).push(V8ObjectUtils.toV8Object(v8, params)));
    }

}
