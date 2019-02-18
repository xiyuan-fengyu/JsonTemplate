package com.xiyuan.json;

import com.eclipsesource.v8.V8;
import com.eclipsesource.v8.V8Array;
import com.eclipsesource.v8.V8Function;
import com.eclipsesource.v8.utils.V8ObjectUtils;

import java.io.File;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.LinkedBlockingQueue;

/**
 * Created by xiyuan_fengyu on 2019/2/13 18:51.
 */
public class JsonTemplate {

    private static final LinkedBlockingQueue<FillTask> fillTasks = new LinkedBlockingQueue<>();

    static {
        String jsonTemplateJs = readFromResource("JsonTemplate.js");
        if (jsonTemplateJs == null) {
            throw new IllegalStateException("JsonTemplate.js is missing");
        }

        Thread thread = new Thread(() -> {
            // 创建一个临时文件夹，防止多个应用解压出来的 lib 文件路径一致，导致文件占用，无法正常删除和写入
            // 参考 com.eclipsesource.v8.LibraryLoader.extract 方法
            String tempdir = System.getProperty("java.io.tmpdir");
            String separator = System.getProperty("file.separator");
            File extractTo = null;
            while (extractTo == null) {
                extractTo = new File(tempdir + separator + UUID.randomUUID());
                if (!extractTo.exists() && extractTo.mkdirs()) {
                    break;
                }
            }

            V8 v8 = V8.createV8Runtime(null, extractTo.getAbsolutePath());
            v8.add("__release__", true);
            V8Function fillTemplateStr = (V8Function) v8.executeScript(jsonTemplateJs, "JsonTemplate.js", 1);

            while (Thread.currentThread().isAlive()) {
                try {
                    FillTask fillTask = fillTasks.take();
                    try {
                        String res = (String) fillTemplateStr.call(null,
                                new V8Array(v8).push(fillTask.template).push(V8ObjectUtils.toV8Object(v8, fillTask.params)));
                        fillTask.future.complete(res);
                    }
                    catch (Exception e) {
                        fillTask.future.complete(e);
                    }
                }
                catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        });
        thread.setDaemon(true);
        thread.start();
    }

    public static String readFromResource(String path) {
        try (InputStream in = JsonTemplate.class.getClassLoader().getResourceAsStream(path)) {
            byte[] bytes = new byte[in.available()];
            if (in.read(bytes) > 0) {
                return new String(bytes, StandardCharsets.UTF_8);
            }
            else {
                throw new RuntimeException("read fail: " + path + ", file is empty");
            }
        } catch (Exception e) {
            throw new RuntimeException("read fail: " + path, e);
        }
    }

    public static String fill(String template, Map<String, Object> params) {
        return new FillTask(template, params).execute();
    }

    public static String fill(String template, Object ...params) {
        Map<String, Object> paramMap = null;
        if (params != null && params.length > 0) {
            paramMap = new HashMap<>();
            for (int i = 0, len = params.length; i < len; i++) {
                paramMap.put("$" + i, params[i]);
            }
        }
        return fill(template, paramMap);
    }

    private static class FillTask {

        private final String template;

        private final Map<String, Object> params;

        private final CompletableFuture<Object> future = new CompletableFuture<>();

        private FillTask(String template, Map<String, Object> params) {
            this.template = template;
            this.params = params;
            fillTasks.offer(this);
        }

        private String execute() {
            try {
                Object result = future.get();
                if (result instanceof Exception) {
                    throw new RuntimeException((Throwable) result);
                }
                return (String) result;
            } catch (InterruptedException | ExecutionException e) {
                throw new RuntimeException(e);
            }
        }

    }

}
