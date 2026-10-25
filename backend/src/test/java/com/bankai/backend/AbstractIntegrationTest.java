package com.bankai.backend;

import com.bankai.backend.address.Address;
import com.bankai.backend.address.AddressRepository;
import com.bankai.backend.cart.CartDtos.AddCartItemRequest;
import com.bankai.backend.cart.CartService;
import com.bankai.backend.category.Category;
import com.bankai.backend.category.CategoryRepository;
import com.bankai.backend.order.OrderDtos.CheckoutRequest;
import com.bankai.backend.order.OrderDtos.OrderResponse;
import com.bankai.backend.order.OrderService;
import com.bankai.backend.payment.PaymentMethod;
import com.bankai.backend.product.Product;
import com.bankai.backend.product.ProductRepository;
import com.bankai.backend.user.Role;
import com.bankai.backend.user.User;
import com.bankai.backend.user.UserRepository;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;

/**
 * Starts one PostgreSQL container for all integration tests (requires Docker).
 */
@SpringBootTest
@AutoConfigureMockMvc
public abstract class AbstractIntegrationTest {
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    static {
        POSTGRES.start();
    }

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired
    protected UserRepository users;
    @Autowired
    protected CategoryRepository categories;
    @Autowired
    protected ProductRepository products;
    @Autowired
    protected AddressRepository addresses;
    @Autowired
    protected CartService cartService;
    @Autowired
    protected OrderService orderService;
    @Autowired
    protected PasswordEncoder encoder;

    protected User newUser(Role role) {
        User u = new User();
        u.setEmail(UUID.randomUUID() + "@test.local");
        u.setPasswordHash(encoder.encode("password123"));
        u.setFullName("Test User");
        u.setRole(role);
        return users.save(u);
    }

    protected Category newCategory() {
        Category c = new Category();
        c.setName("Category-" + UUID.randomUUID());
        return categories.save(c);
    }

    protected Product newProduct(String price, int stock) {
        Product p = new Product();
        p.setTitle("Book " + UUID.randomUUID());
        p.setAuthor("Some Author");
        p.setIsbn(String.valueOf(ThreadLocalRandom.current().nextLong(1_000_000_000_000L, 9_999_999_999_999L)));
        p.setPrice(new BigDecimal(price));
        p.setStockQuantity(stock);
        p.setCategory(newCategory());
        p.setActive(true);
        return products.save(p);
    }

    protected Address newAddress(User user) {
        Address a = new Address();
        a.setUser(user);
        a.setRecipientName("Test User");
        a.setPhone("0100000000");
        a.setLine1("1 Test Street");
        a.setCity("Mansoura");
        a.setPostalCode("35511");
        a.setCountry("Egypt");
        return addresses.save(a);
    }

    protected OrderResponse placeOrder(User user, Product product, int quantity) {
        Address address = newAddress(user);
        cartService.addItem(user.getId(), new AddCartItemRequest(product.getId(), quantity));
        return orderService.checkout(user.getId(), new CheckoutRequest(address.getId(), PaymentMethod.COD));
    }

    protected int stockOf(Product p) {
        return products.findById(p.getId()).orElseThrow().getStockQuantity();
    }
}