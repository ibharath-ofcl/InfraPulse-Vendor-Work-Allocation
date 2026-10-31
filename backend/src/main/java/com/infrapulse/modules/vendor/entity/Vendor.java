package com.infrapulse.modules.vendor.entity;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.vendor.enums.ServiceCategory;
import com.infrapulse.modules.vendor.enums.VendorStatus;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "vendors")
public class Vendor {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "vendor_code", length = 50, nullable = false, unique = true)
    private String vendorCode;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(name = "contact_person", nullable = false)
    private String contactPerson;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "phone_number", length = 50, nullable = false)
    private String phoneNumber;

    @Column(name = "alternate_phone", length = 50)
    private String alternatePhone;

    @Column(name = "address_line")
    private String addressLine;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "district", length = 100)
    private String district;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "pincode", length = 20, nullable = false)
    private String pincode;

    @Column(name = "gst_number", length = 50)
    private String gstNumber;

    @Column(name = "registration_number", length = 100)
    private String registrationNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50, nullable = false)
    private VendorStatus status = VendorStatus.PENDING_VERIFICATION;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "vendor_service_categories",
        joinColumns = @JoinColumn(name = "vendor_id")
    )
    @Column(name = "service_category", nullable = false)
    @Enumerated(EnumType.STRING)
    private Set<ServiceCategory> serviceCategories = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Vendor() {
    }

    public Vendor(
        String id,
        String vendorCode,
        String companyName,
        String contactPerson,
        String email,
        String phoneNumber,
        String alternatePhone,
        String addressLine,
        String city,
        String district,
        String state,
        String pincode,
        String gstNumber,
        String registrationNumber,
        VendorStatus status,
        Set<ServiceCategory> serviceCategories,
        User user,
        User createdBy
    ) {
        this.id = id != null ? id : UUID.randomUUID().toString();
        this.vendorCode = vendorCode;
        this.companyName = companyName;
        this.contactPerson = contactPerson;
        this.email = email != null ? email.toLowerCase().trim() : null;
        this.phoneNumber = phoneNumber;
        this.alternatePhone = alternatePhone;
        this.addressLine = addressLine;
        this.city = city;
        this.district = district;
        this.state = state;
        this.pincode = pincode;
        this.gstNumber = gstNumber;
        this.registrationNumber = registrationNumber;
        this.status = status != null ? status : VendorStatus.PENDING_VERIFICATION;
        if (serviceCategories != null) {
            this.serviceCategories.addAll(serviceCategories);
        }
        this.user = user;
        this.createdBy = createdBy;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        if (this.email != null) {
            this.email = this.email.toLowerCase().trim();
        }
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        if (this.email != null) {
            this.email = this.email.toLowerCase().trim();
        }
        this.updatedAt = Instant.now();
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getVendorCode() {
        return vendorCode;
    }

    public void setVendorCode(String vendorCode) {
        this.vendorCode = vendorCode;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getContactPerson() {
        return contactPerson;
    }

    public void setContactPerson(String contactPerson) {
        this.contactPerson = contactPerson;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email != null ? email.toLowerCase().trim() : null;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getAlternatePhone() {
        return alternatePhone;
    }

    public void setAlternatePhone(String alternatePhone) {
        this.alternatePhone = alternatePhone;
    }

    public String getAddressLine() {
        return addressLine;
    }

    public void setAddressLine(String addressLine) {
        this.addressLine = addressLine;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getPincode() {
        return pincode;
    }

    public void setPincode(String pincode) {
        this.pincode = pincode;
    }

    public String getGstNumber() {
        return gstNumber;
    }

    public void setGstNumber(String gstNumber) {
        this.gstNumber = gstNumber;
    }

    public String getRegistrationNumber() {
        return registrationNumber;
    }

    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber;
    }

    public VendorStatus getStatus() {
        return status;
    }

    public void setStatus(VendorStatus status) {
        this.status = status;
    }

    public Set<ServiceCategory> getServiceCategories() {
        return serviceCategories;
    }

    public void setServiceCategories(Set<ServiceCategory> serviceCategories) {
        this.serviceCategories = serviceCategories;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
