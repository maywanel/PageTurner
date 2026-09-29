package com.example.PageTurner.config;

public class TenantContextHolder {
    private static final ThreadLocal<String> CURRENT_TENANT = new ThreadLocal<>();
    private static final String DEFAULT_TENANT = "public";

    public static void setTenantId(String tenantId) { CURRENT_TENANT.set(tenantId != null ? tenantId : DEFAULT_TENANT); }
    public static String getTenantId() {
        String tenantId = CURRENT_TENANT.get();
        return tenantId != null ? tenantId : DEFAULT_TENANT;
    }
    public static void clear() { CURRENT_TENANT.remove(); }
}