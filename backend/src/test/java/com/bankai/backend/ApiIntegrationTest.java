package com.bankai.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bankai.backend.order.OrderDtos.OrderResponse;
import com.bankai.backend.product.Product;
import com.bankai.backend.security.JwtService;
import com.bankai.backend.user.Role;
import com.bankai.backend.user.User;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

class ApiIntegrationTest extends AbstractIntegrationTest {
    @Autowired
    MockMvc mvc;
    @Autowired
    JwtService jwtService;

    private String bearer(User u) {
        return "Bearer " + jwtService.generate(u);
    }

    @Test
    void registrationHashesPasswordAndIgnoresRequestedRole() throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
                        {"email":"%s","password":"password123","fullName":"Ann","role":"ADMIN"}""".formatted(email)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.user.role").value("CUSTOMER"));

        assertThat(users.findByEmail(email).orElseThrow().getPasswordHash()).startsWith("$2");
    }

    @Test
    void loginTokenAuthenticatesTheMeEndpointAndWrongPasswordIs401() throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
                {"email":"%s","password":"password123","fullName":"Ann"}""".formatted(email))).andExpect(status().isCreated());

        String body = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content("""
                        {"email":"%s","password":"password123"}""".formatted(email)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String token = body.replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");

        mvc.perform(get("/api/v1/auth/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.email").value(email));

        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content("""
                        {"email":"%s","password":"wrong-password"}""".formatted(email)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpointsReturn401WithoutOrWithInvalidToken() throws Exception {
        mvc.perform(get("/api/v1/cart")).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
        mvc.perform(get("/api/v1/cart").header(HttpHeaders.AUTHORIZATION, "Bearer not-a-jwt"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void customerGets403OnAdminEndpointsWhileAdminIsAllowed() throws Exception {
        User customer = newUser(Role.CUSTOMER);
        User admin = newUser(Role.ADMIN);

        mvc.perform(get("/api/v1/admin/dashboard").header(HttpHeaders.AUTHORIZATION, bearer(customer)))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.status").value(403));
        mvc.perform(get("/api/v1/admin/dashboard").header(HttpHeaders.AUTHORIZATION, bearer(admin)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.ordersByStatus.PENDING").exists());
    }

    @Test
    void publicProductListingNeedsNoToken() throws Exception {
        newProduct("12.00", 5);
        mvc.perform(get("/api/v1/products?size=5&sort=price&direction=asc"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void adminProductCreationIsValidated() throws Exception {
        User admin = newUser(Role.ADMIN);
        long categoryId = newCategory().getId();

        mvc.perform(post("/api/v1/admin/products").header(HttpHeaders.AUTHORIZATION, bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"title":"T","author":"A","isbn":"9781234567890","price":-5,"stockQuantity":1,"categoryId":%d}"""
                                .formatted(categoryId)))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fieldErrors.price").exists());

        mvc.perform(post("/api/v1/admin/products").header(HttpHeaders.AUTHORIZATION, bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"title":"Valid Book","author":"A","isbn":"%d","price":19.99,"stockQuantity":4,"categoryId":%d}"""
                                .formatted(System.nanoTime() % 9_000_000_000_000L + 1_000_000_000_000L, categoryId)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.price").value(19.99));
    }

    @Test
    void customersCanOnlyReadTheirOwnOrders() throws Exception {
        User owner = newUser(Role.CUSTOMER);
        User other = newUser(Role.CUSTOMER);
        Product book = newProduct("10.00", 5);
        OrderResponse order = placeOrder(owner, book, 1);

        mvc.perform(get("/api/v1/orders/" + order.id()).header(HttpHeaders.AUTHORIZATION, bearer(owner)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.orderNumber").value(order.orderNumber()));
        mvc.perform(get("/api/v1/orders/" + order.id()).header(HttpHeaders.AUTHORIZATION, bearer(other)))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/orders/" + order.id() + "/cancel").header(HttpHeaders.AUTHORIZATION, bearer(other)))
                .andExpect(status().isNotFound());
    }
}