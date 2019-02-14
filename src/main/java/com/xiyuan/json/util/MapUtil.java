package com.xiyuan.json.util;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by xiyuan_fengyu on 2019/1/17 16:11.
 */
public class MapUtil {

    public static <K, V> Putter<K, V> putter(Map<K, V> map) {
        return new Putter<>(map);
    }

    public static class Putter<K, V> {

        private Map<K, V> map;

        private Putter(Map<K, V> map) {
            if (map == null) {
                throw new IllegalArgumentException("map cannot be null");
            }

            this.map = map;
        }

        public Putter<K, V> put(K key, V value) {
            map.put(key, value);
            return this;
        }

        public Map<K, V> get() {
            return map;
        }

    }

}
