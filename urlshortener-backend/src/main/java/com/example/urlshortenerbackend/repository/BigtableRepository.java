package com.example.urlshortenerbackend.repository;

import com.example.urlshortenerbackend.model.UrlEntity;
import com.google.cloud.bigtable.data.v2.BigtableDataClient;
import com.google.cloud.bigtable.data.v2.models.*;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public class BigtableRepository {

    private static final String TABLE_NAME = "team2_url_shortener";

    // Column Family: short_urls
    private static final String CF_SHORT_URLS = "short_urls";
    private static final String COL_ORIGINAL_URL = "original_url";

    // Column Family: metadata
    private static final String CF_METADATA = "metadata";
    private static final String COL_CLICK_COUNT = "click_count";
    private static final String COL_LAST_ACCESS = "last_access";

    private final BigtableDataClient bigtableClient;

    public BigtableRepository(BigtableDataClient bigtableClient) {
        this.bigtableClient = bigtableClient;
    }

    public void saveUrl(UrlEntity urlEntity) {
        RowMutation rowMutation = RowMutation.create(TABLE_NAME, urlEntity.getId())
                .setCell(CF_SHORT_URLS, COL_ORIGINAL_URL, urlEntity.getOriginalUrl())
                .setCell(CF_METADATA, COL_CLICK_COUNT, String.valueOf(0))  // init click time as 0
                .setCell(CF_METADATA, COL_LAST_ACCESS,
                        Instant.ofEpochSecond(urlEntity.getCreatedAt()).toString()); // created time is the original last access time

        bigtableClient.mutateRow(rowMutation);
    }

    public Optional<UrlEntity> getUrlById(String id) {
        Row row = bigtableClient.readRow(TABLE_NAME, id);
        if (row == null) return Optional.empty();

        String originalUrl = row.getCells(CF_SHORT_URLS, COL_ORIGINAL_URL)
                .get(0).getValue().toStringUtf8();
        long clickCount = Long.parseLong(row.getCells(CF_METADATA, COL_CLICK_COUNT)
                .get(0).getValue().toStringUtf8());
        String lastAccess = row.getCells(CF_METADATA, COL_LAST_ACCESS)
                .get(0).getValue().toStringUtf8();

        UrlEntity entity = new UrlEntity();
        entity.setId(id);
        entity.setOriginalUrl(originalUrl);
        entity.setCreatedAt(Instant.now().getEpochSecond());  // 这里可以考虑添加创建时间列
        entity.setClickCount(clickCount);
        entity.setLastAccess(lastAccess);

        return Optional.of(entity);
    }

    public void incrementClickCount(String id) {
        Row row = bigtableClient.readRow(TABLE_NAME, id);
        if (row != null) {
            long currentCount = Long.parseLong(row.getCells(CF_METADATA, COL_CLICK_COUNT)
                    .get(0).getValue().toStringUtf8());

            RowMutation rowMutation = RowMutation.create(TABLE_NAME, id)
                    .setCell(CF_METADATA, COL_CLICK_COUNT, String.valueOf(currentCount + 1))
                    .setCell(CF_METADATA, COL_LAST_ACCESS, Instant.now().toString());

            bigtableClient.mutateRow(rowMutation);
        }
    }

    public void deleteUrl(String id) {
        bigtableClient.mutateRow(RowMutation.create(TABLE_NAME, id).deleteRow());
    }
}