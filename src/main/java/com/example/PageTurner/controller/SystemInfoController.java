package com.example.PageTurner.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringBootVersion;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.RuntimeMXBean;
import java.lang.management.ThreadMXBean;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/system")
public class SystemInfoController {

    @Value("${spring.application.name:PageTurner}")
    private String applicationName;

    @Value("${server.port:1337}")
    private String serverPort;

    @Value("${server.address:0.0.0.0}")
    private String serverAddress;

    @GetMapping("/info")
    public Map<String, Object> getSystemInfo() {
        Map<String, Object> info = new HashMap<>();

        // Runtime information
        Runtime runtime = Runtime.getRuntime();
        RuntimeMXBean runtimeMXBean = ManagementFactory.getRuntimeMXBean();
        MemoryMXBean memoryMXBean = ManagementFactory.getMemoryMXBean();
        ThreadMXBean threadMXBean = ManagementFactory.getThreadMXBean();

        // Application info
        info.put("applicationName", applicationName);
        info.put("springVersion", SpringBootVersion.getVersion());
        info.put("javaVersion", System.getProperty("java.version"));

        // CPU info
        info.put("processors", runtime.availableProcessors());

        // Memory info (in bytes)
        info.put("totalMemory", runtime.totalMemory());
        info.put("freeMemory", runtime.freeMemory());
        info.put("maxMemory", runtime.maxMemory());

        // Heap memory info
        info.put("heapMemoryUsed", memoryMXBean.getHeapMemoryUsage().getUsed());
        info.put("heapMemoryMax", memoryMXBean.getHeapMemoryUsage().getMax());
        info.put("heapMemoryTotal", memoryMXBean.getHeapMemoryUsage().getCommitted());

        // Non-heap memory info
        info.put("nonHeapMemoryUsed", memoryMXBean.getNonHeapMemoryUsage().getUsed());
        info.put("nonHeapMemoryMax", memoryMXBean.getNonHeapMemoryUsage().getMax());

        // Thread info
        info.put("activeThreads", threadMXBean.getThreadCount());
        info.put("peakThreads", threadMXBean.getPeakThreadCount());
        info.put("daemonThreads", threadMXBean.getDaemonThreadCount());

        // Runtime info
        info.put("uptime", runtimeMXBean.getUptime());
        info.put("startTime", runtimeMXBean.getStartTime());

        // System properties
        info.put("osName", System.getProperty("os.name"));
        info.put("osVersion", System.getProperty("os.version"));
        info.put("osArch", System.getProperty("os.arch"));
        info.put("jvmName", System.getProperty("java.vm.name"));
        info.put("jvmVendor", System.getProperty("java.vm.vendor"));
        info.put("jvmVersion", System.getProperty("java.vm.version"));
        info.put("userName", System.getProperty("user.name"));
        info.put("userHome", System.getProperty("user.home"));
        info.put("workingDirectory", System.getProperty("user.dir"));

        // Server info
        info.put("serverPort", serverPort);
        info.put("serverAddress", serverAddress);
        info.put("contextPath", "/");
        
        // Active profiles
        String profiles = System.getProperty("spring.profiles.active");
        info.put("activeProfiles", profiles != null ? profiles : "default");

        // Class path
        info.put("javaClassPath", System.getProperty("java.class.path"));
        info.put("javaLibraryPath", System.getProperty("java.library.path"));

        // Encoding
        info.put("fileEncoding", System.getProperty("file.encoding"));
        info.put("defaultCharset", java.nio.charset.Charset.defaultCharset().name());

        // Timestamp
        info.put("timestamp", System.currentTimeMillis());

        return info;
    }

    @GetMapping("/health")
    public Map<String, Object> getHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("timestamp", System.currentTimeMillis());
        
        Runtime runtime = Runtime.getRuntime();
        long usedMemory = runtime.totalMemory() - runtime.freeMemory();
        long maxMemory = runtime.maxMemory();
        double memoryUsagePercent = (double) usedMemory / maxMemory * 100;
        
        health.put("memoryUsagePercent", Math.round(memoryUsagePercent * 100.0) / 100.0);
        health.put("healthStatus", memoryUsagePercent > 90 ? "WARNING" : "HEALTHY");
        
        return health;
    }
}
