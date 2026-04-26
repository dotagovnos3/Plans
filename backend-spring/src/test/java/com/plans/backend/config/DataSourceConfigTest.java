package com.plans.backend.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

class DataSourceConfigTest {

    @Test
    void postgresUrlWithoutPortUsesDefaultPostgresPort() {
        MockEnvironment environment = new MockEnvironment()
            .withProperty("DATABASE_URL", "postgres://db_user:db_password@db.example.com/plans");

        try (HikariDataSource dataSource = (HikariDataSource) new DataSourceConfig().dataSource(environment)) {
            assertThat(dataSource.getJdbcUrl()).isEqualTo("jdbc:postgresql://db.example.com:5432/plans");
            assertThat(dataSource.getUsername()).isEqualTo("db_user");
            assertThat(dataSource.getPassword()).isEqualTo("db_password");
        }
    }
}
