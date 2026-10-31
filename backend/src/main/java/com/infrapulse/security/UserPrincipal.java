package com.infrapulse.security;

import com.infrapulse.modules.auth.model.Permission;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

public class UserPrincipal implements UserDetails {

    private final User user;
    private final Set<GrantedAuthority> authorities;

    public UserPrincipal(User user) {
        this.user = user;
        Set<GrantedAuthority> auths = new HashSet<>();
        
        // Add Spring Security role authority: ROLE_<ROLE>
        auths.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
        
        // Add explicit permission authorities
        for (Permission permission : user.getRole().getPermissions()) {
            auths.add(new SimpleGrantedAuthority(permission.name()));
        }
        
        this.authorities = auths;
    }

    public User getUser() {
        return user;
    }

    public String getId() {
        return user.getId();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return user.getPasswordHash();
    }

    @Override
    public String getUsername() {
        return user.getEmail();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return user.getStatus() != UserStatus.LOCKED;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return user.getStatus() == UserStatus.ACTIVE;
    }
}
