package com.example.demo.model;
import jakarta.persistence.*;


@Entity
@Table(name = "users")
public class User {
    
    public enum Role {
        SUPER_ADMIN,
        TENANT_ADMIN,
        USER
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String name;
    
    @Column(name = "role")
    private Role role = Role.USER;

    @Column(unique = true)
    private String email;
    
    private String password;

    @Column(name = "tenant_id")
    private String tenantId;

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
