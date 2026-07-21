import { useEffect, useMemo, useState } from "react";
import {
  Trash2,
  ShoppingBag,
  TrendingDown,
  ExternalLink,
  Info,
  Share2,
  Heart,
} from "lucide-react";
import {
  Product,
  getCheapestStore,
  STORE_COLORS,
  STORE_ORDER,
  StoreName,
} from "../data";

interface CartOptimizerProps {
  items: Product[];
  onRemoveItem: (id: string) => void;
}

interface BreakdownItem {
  product: Product;
  store: Product["stores"][number];
  quantity: number;
  total: number;
}

const formatPrice = (price: number) => {
  return price.toLocaleString("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

export function CartOptimizer({
  items,
  onRemoveItem,
}: CartOptimizerProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    () =>
      Object.fromEntries(
        items.map((product) => [product.id, 1]),
      ),
  );

  const [activeOption, setActiveOption] = useState<
    "single" | "split"
  >("split");

  useEffect(() => {
    setQuantities((previousQuantities) => {
      const updatedQuantities = { ...previousQuantities };

      items.forEach((product) => {
        if (!updatedQuantities[product.id]) {
          updatedQuantities[product.id] = 1;
        }
      });

      Object.keys(updatedQuantities).forEach((productId) => {
        const productStillExists = items.some(
          (product) => product.id === productId,
        );

        if (!productStillExists) {
          delete updatedQuantities[productId];
        }
      });

      return updatedQuantities;
    });
  }, [items]);

  const getQuantity = (productId: string) => {
    return quantities[productId] || 1;
  };

  const increaseQuantity = (productId: string) => {
    setQuantities((previousQuantities) => ({
      ...previousQuantities,
      [productId]:
        (previousQuantities[productId] || 1) + 1,
    }));
  };

  const decreaseQuantity = (productId: string) => {
    setQuantities((previousQuantities) => ({
      ...previousQuantities,
      [productId]: Math.max(
        1,
        (previousQuantities[productId] || 1) - 1,
      ),
    }));
  };

  const storeTotals = useMemo(() => {
    const totals = {} as Record<StoreName, number>;

    STORE_ORDER.forEach((storeName) => {
      totals[storeName] = items.reduce(
        (total, product) => {
          const store = product.stores.find(
            (productStore) =>
              productStore.name === storeName,
          );

          if (!store) {
            return total;
          }

          const price = Number(store.price);
          const quantity = quantities[product.id] || 1;

          if (!Number.isFinite(price) || price <= 0) {
            return total;
          }

          return total + price * quantity;
        },
        0,
      );
    });

    return totals;
  }, [items, quantities]);

  const eligibleStores = useMemo(() => {
    return STORE_ORDER.filter((storeName) =>
      items.every((product) =>
        product.stores.some((store) => {
          const price = Number(store.price);

          return (
            store.name === storeName &&
            Number.isFinite(price) &&
            price > 0
          );
        }),
      ),
    );
  }, [items]);

  const cheapestSingleStore = useMemo<{
    name: StoreName;
    total: number;
  } | null>(() => {
    if (eligibleStores.length === 0) {
      return null;
    }

    return eligibleStores.reduce<{
      name: StoreName;
      total: number;
    }>(
      (bestStore, currentStoreName) => {
        const currentTotal =
          storeTotals[currentStoreName];

        if (currentTotal < bestStore.total) {
          return {
            name: currentStoreName,
            total: currentTotal,
          };
        }

        return bestStore;
      },
      {
        name: eligibleStores[0],
        total: storeTotals[eligibleStores[0]],
      },
    );
  }, [eligibleStores, storeTotals]);

  const breakdown = useMemo<BreakdownItem[]>(() => {
    return items.map((product) => {
      const cheapestStore = getCheapestStore(
        product.stores,
      );

      const quantity = quantities[product.id] || 1;
      const unitPrice = Number(cheapestStore.price);

      return {
        product,
        store: cheapestStore,
        quantity,
        total: unitPrice * quantity,
      };
    });
  }, [items, quantities]);

  const splitTotal = useMemo(() => {
    return breakdown.reduce(
      (total, item) => total + item.total,
      0,
    );
  }, [breakdown]);

  const savings = useMemo(() => {
    if (!cheapestSingleStore) {
      return 0;
    }

    const difference =
      cheapestSingleStore.total - splitTotal;

    return (
      Math.round(Math.max(0, difference) * 100) / 100
    );
  }, [cheapestSingleStore, splitTotal]);

  const maxTotal = useMemo(() => {
    return Math.max(
      ...STORE_ORDER.map((storeName) =>
        eligibleStores.includes(storeName)
          ? storeTotals[storeName]
          : 0,
      ),
      splitTotal,
      1,
    );
  }, [eligibleStores, storeTotals, splitTotal]);

  const groupedBreakdown = useMemo(() => {
    return breakdown.reduce<
      Partial<Record<StoreName, BreakdownItem[]>>
    >((groups, breakdownItem) => {
      const storeName =
        breakdownItem.store.name as StoreName;

      if (!groups[storeName]) {
        groups[storeName] = [];
      }

      groups[storeName]?.push(breakdownItem);

      return groups;
    }, {});
  }, [breakdown]);

  const totalProductQuantity = useMemo(() => {
    return items.reduce(
      (total, product) =>
        total + (quantities[product.id] || 1),
      0,
    );
  }, [items, quantities]);

  if (items.length === 0) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#F5F5F0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: 40,
          }}
        >
          <div
            style={{
              fontSize: 48,
              marginBottom: 16,
            }}
          >
            🛒
          </div>

          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#1A1A1A",
              marginBottom: 8,
            }}
          >
            Sepetin boş
          </div>

          <div
            style={{
              fontSize: 14,
              color: "#666",
            }}
          >
            Ürün kataloğundan veya AI asistanından
            ürün ekle
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F5F5F0",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Üst başlık */}
      <div
        style={{
          background: "#FFFFFF",
          borderBottom: "1px solid #E8E8E2",
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={{ flex: 1 }}>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#1A1A1A",
              margin: 0,
            }}
          >
            Sepet Optimizasyonu
          </h1>

          <p
            style={{
              fontSize: 12,
              color: "#666",
              margin: "2px 0 0",
            }}
          >
            {items.length} farklı ürün ·{" "}
            {totalProductQuantity} adet · 4 mağazada en
            iyi kombinasyon
          </p>
        </div>

        <button
          type="button"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 8,
            border: "1.5px solid #E0E0DA",
            background: "#FFFFFF",
            color: "#666",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          <Share2 size={14} />
          Paylaş
        </button>

        <button
          type="button"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 8,
            border: "1.5px solid #E0E0DA",
            background: "#FFFFFF",
            color: "#666",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          <Heart size={14} />
          Favorilere Ekle
        </button>
      </div>

      {/* Mağaza özetleri */}
      <div
        style={{
          background: "#FFFFFF",
          borderBottom: "1px solid #E8E8E2",
          padding: "0 32px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
          }}
        >
          {STORE_ORDER.map((storeName) => {
            const isEligible =
              eligibleStores.includes(storeName);

            const total = storeTotals[storeName];

            const isBest =
              cheapestSingleStore !== null &&
              storeName === cheapestSingleStore.name;

            const storeColor =
              STORE_COLORS[storeName];

            const barPercentage = isEligible
              ? (total / maxTotal) * 100
              : 0;

            return (
              <div
                key={storeName}
                style={{
                  padding: "16px 20px",
                  borderRight:
                    "1px solid #F0F0EC",
                  background: isBest
                    ? storeColor.light
                    : "transparent",
                  position: "relative",
                }}
              >
                {isBest && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: storeColor.color,
                    }}
                  />
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "space-between",
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: isBest
                        ? storeColor.color
                        : "#999",
                      textTransform: "uppercase",
                    }}
                  >
                    {storeName}
                  </div>

                  {isBest && (
                    <span
                      style={{
                        fontSize: 9,
                        background:
                          storeColor.color,
                        color: "#FFFFFF",
                        padding: "2px 7px",
                        borderRadius: 20,
                        fontWeight: 700,
                      }}
                    >
                      EN İYİ
                    </span>
                  )}
                </div>

                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: isBest
                      ? storeColor.color
                      : "#1A1A1A",
                    marginBottom: 6,
                  }}
                >
                  {isEligible
                    ? `₺${formatPrice(total)}`
                    : "Stok yok"}
                </div>

                <div
                  style={{
                    height: 4,
                    borderRadius: 2,
                    background: "#EEEEE8",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: isEligible
                        ? `${Math.max(
                            12,
                            100 -
                              barPercentage +
                              30,
                          )}%`
                        : "0%",
                      maxWidth: "100%",
                      background: isBest
                        ? storeColor.color
                        : "#DDDDD8",
                    }}
                  />
                </div>

                <div
                  style={{
                    fontSize: 11,
                    color: "#999",
                    marginTop: 4,
                  }}
                >
                  Kargo dahil değil
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ana içerik */}
      <div
        style={{
          display: "flex",
          gap: 24,
          padding: "28px 32px",
          alignItems: "flex-start",
        }}
      >
        {/* Sol taraf */}
        <div
          style={{
            flex: "0 0 380px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#1A1A1A",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Sepetteki Ürünler
          </div>

          {items.map((product) => {
            const cheapestStore =
              getCheapestStore(product.stores);

            const quantity =
              quantities[product.id] || 1;

            const unitPrice = Number(
              cheapestStore.price,
            );

            const productTotal =
              unitPrice * quantity;

            const storeColor =
              STORE_COLORS[cheapestStore.name];

            return (
              <div
                key={product.id}
                style={{
                  background: "#FFFFFF",
                  borderRadius: 12,
                  border:
                    "1.5px solid #E8E8E2",
                  boxShadow:
                    "0 4px 16px rgba(0,0,0,0.06)",
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <img
                  src={product.image}
                  alt={product.title}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 8,
                    objectFit: "contain",
                    border:
                      "1px solid #F0F0EC",
                    flexShrink: 0,
                  }}
                />

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: "#2D6A4F",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    {product.brand}
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#1A1A1A",
                      marginTop: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {product.title}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 4,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        background:
                          storeColor.light,
                        color: storeColor.color,
                        padding: "2px 7px",
                        borderRadius: 20,
                      }}
                    >
                      {cheapestStore.name}
                    </span>

                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#1A1A1A",
                      }}
                    >
                      ₺{formatPrice(productTotal)}
                    </span>

                    {quantity > 1 && (
                      <span
                        style={{
                          fontSize: 10,
                          color: "#999",
                        }}
                      >
                        ₺{formatPrice(unitPrice)} ×{" "}
                        {quantity}
                      </span>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      decreaseQuantity(product.id)
                    }
                    disabled={quantity <= 1}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      border:
                        "1.5px solid #E0E0DA",
                      background: "#FFFFFF",
                      cursor:
                        quantity <= 1
                          ? "not-allowed"
                          : "pointer",
                      opacity:
                        quantity <= 1 ? 0.5 : 1,
                    }}
                  >
                    −
                  </button>

                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      width: 20,
                      textAlign: "center",
                    }}
                  >
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      increaseQuantity(product.id)
                    }
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      border:
                        "1.5px solid #E0E0DA",
                      background: "#FFFFFF",
                      cursor: "pointer",
                    }}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onRemoveItem(product.id)
                  }
                  title="Sepetten kaldır"
                  style={{
                    padding: 6,
                    border: "none",
                    background: "transparent",
                    color: "#CCC",
                    cursor: "pointer",
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Sağ taraf */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#1A1A1A",
              textTransform: "uppercase",
            }}
          >
            En Uygun Sepet
          </div>

          {/* Tek Kargo */}
          {cheapestSingleStore ? (
            <div
              onClick={() =>
                setActiveOption("single")
              }
              style={{
                background: "#FFFFFF",
                borderRadius: 12,
                border:
                  activeOption === "single"
                    ? "2px solid #2D6A4F"
                    : "1.5px solid #E8E8E2",
                boxShadow:
                  "0 4px 16px rgba(0,0,0,0.06)",
                overflow: "hidden",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  borderBottom:
                    "1px solid #F0F0EC",
                }}
              >
                <ShoppingBag
                  size={16}
                  style={{ color: "#666" }}
                />

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    Tek Kargo
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: "#666",
                    }}
                  >
                    Tüm ürünleri{" "}
                    {cheapestSingleStore.name}
                    &apos;ten al
                  </div>
                </div>

                <div
                  style={{
                    textAlign: "right",
                  }}
                >
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    ₺
                    {formatPrice(
                      cheapestSingleStore.total,
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color: "#999",
                    }}
                  >
                    + kargo ücreti
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: "10px 18px",
                }}
              >
                {items.map((product) => {
                  const storePrice =
                    product.stores.find(
                      (store) =>
                        store.name ===
                        cheapestSingleStore.name,
                    );

                  const quantity =
                    quantities[product.id] || 1;

                  const itemTotal =
                    Number(
                      storePrice?.price || 0,
                    ) * quantity;

                  return (
                    <div
                      key={product.id}
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        padding: "6px 0",
                        fontSize: 12,
                        color: "#666",
                        borderBottom:
                          "1px dashed #F0F0EC",
                      }}
                    >
                      <span>
                        {product.brand}{" "}
                        {product.title.split(" ")[0]}
                        {quantity > 1
                          ? ` × ${quantity}`
                          : ""}
                      </span>

                      <span
                        style={{
                          fontWeight: 500,
                          color: "#1A1A1A",
                        }}
                      >
                        ₺{formatPrice(itemTotal)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  padding: "10px 18px",
                  textAlign: "right",
                }}
              >
                <button
                  type="button"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "9px 18px",
                    borderRadius: 8,
                    border: "none",
                    background: "#2D6A4F",
                    color: "#FFFFFF",
                    cursor: "pointer",
                    marginLeft: "auto",
                  }}
                >
                  <ExternalLink size={13} />
                  {cheapestSingleStore.name}
                  &apos;e Git
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 12,
                border:
                  "1.5px solid #E8E8E2",
                padding: "16px 18px",
              }}
            >
              Sepetteki tüm ürünleri satan tek bir
              mağaza yok. En iyi seçenek:{" "}
              <strong>Akıllı Bölme</strong>.
            </div>
          )}

          {/* Akıllı Bölme */}
          <div
            onClick={() =>
              setActiveOption("split")
            }
            style={{
              background: "#FFFFFF",
              borderRadius: 12,
              border:
                activeOption === "split"
                  ? "2px solid #2D6A4F"
                  : "1.5px solid #E8E8E2",
              boxShadow:
                "0 4px 20px rgba(0,0,0,0.08)",
              overflow: "hidden",
              cursor: "pointer",
            }}
          >
            {/* Düzeltilen başlık alanı */}
            <div
              style={{
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                borderBottom:
                  "1px solid #F0F0EC",
                flexWrap: "wrap",
              }}
            >
              <TrendingDown
                size={16}
                style={{
                  color: "#2D6A4F",
                  flexShrink: 0,
                }}
              />

              <div
                style={{
                  flex: "1 1 220px",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#1A1A1A",
                  }}
                >
                  Akıllı Bölme
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: "#666",
                  }}
                >
                  Her ürünü en ucuz mağazadan al
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 16,
                  flexWrap: "wrap",
                  marginLeft: "auto",
                }}
              >
                <div
                  style={{
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: "#1B4332",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ₺{formatPrice(splitTotal)}
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color: "#52B788",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {savings > 0
                      ? `₺${formatPrice(
                          savings,
                        )} tasarruf!`
                      : "En uygun fiyat"}
                  </div>
                </div>

                <div
                  style={{
                    background: "#FFB7B2",
                    color: "#1B4332",
                    borderRadius: 20,
                    padding: "5px 12px",
                    fontSize: 11,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  Maksimum Tasarruf
                </div>
              </div>
            </div>

            {/* Mağazalara göre dağılım */}
            <div
              style={{
                padding: "12px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {STORE_ORDER.map((storeName) => {
                const storeItems =
                  groupedBreakdown[storeName];

                if (!storeItems?.length) {
                  return null;
                }

                const storeColor =
                  STORE_COLORS[storeName];

                const storeTotal =
                  storeItems.reduce(
                    (total, item) =>
                      total + item.total,
                    0,
                  );

                return (
                  <div
                    key={storeName}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      background:
                        storeColor.light,
                      border: `1px solid ${storeColor.color}22`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color:
                            storeColor.color,
                          textTransform:
                            "uppercase",
                        }}
                      >
                        {storeName}
                      </span>

                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#1A1A1A",
                        }}
                      >
                        ₺{formatPrice(storeTotal)}
                      </span>
                    </div>

                    {storeItems.map(
                      ({
                        product,
                        quantity,
                        store,
                        total,
                      }) => (
                        <div
                          key={product.id}
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "flex-start",
                            gap: 12,
                            padding: "3px 4px",
                            fontSize: 11.5,
                            color: "#555",
                          }}
                        >
                          <span>
                            · {product.brand}{" "}
                            {product.title
                              .split(" ")
                              .slice(0, 2)
                              .join(" ")}
                            {quantity > 1
                              ? ` × ${quantity}`
                              : ""}
                          </span>

                          <span
                            style={{
                              whiteSpace: "nowrap",
                              fontWeight: 500,
                            }}
                          >
                            ₺{formatPrice(total)}
                            {quantity > 1 && (
                              <span
                                style={{
                                  marginLeft: 4,
                                  color: "#888",
                                  fontWeight: 400,
                                }}
                              >
                                (₺
                                {formatPrice(
                                  Number(
                                    store.price,
                                  ),
                                )}{" "}
                                × {quantity})
                              </span>
                            )}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mağazaya git butonları */}
            <div
              style={{
                padding: "10px 18px 14px",
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {STORE_ORDER.filter(
                (storeName) =>
                  groupedBreakdown[storeName]
                    ?.length,
              ).map((storeName) => {
                const storeColor =
                  STORE_COLORS[storeName];

                return (
                  <button
                    type="button"
                    key={storeName}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 16px",
                      borderRadius: 8,
                      border: "none",
                      background:
                        storeColor.color,
                      color: "#FFFFFF",
                      cursor: "pointer",
                      fontSize: 12.5,
                      fontWeight: 600,
                    }}
                  >
                    <ExternalLink size={12} />
                    {storeName}&apos;e Git
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bilgilendirme */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 6,
              padding: "10px 14px",
              background: "#FFFBF0",
              borderRadius: 8,
              border: "1px solid #F5E4A8",
            }}
          >
            <Info
              size={13}
              style={{
                color: "#B8860B",
                flexShrink: 0,
                marginTop: 1,
              }}
            />

            <p
              style={{
                fontSize: 11,
                color: "#8B6914",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Bu öneriler iş birlikleri içerebilir.
              Tüm fiyat karşılaştırmaları gerçek
              zamanlı veriye dayanmaktadır.
            </p>
          </div>

          {/* Toplam özeti */}
          <div
            style={{
              background:
                "linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)",
              borderRadius: 12,
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  color:
                    "rgba(255,255,255,0.6)",
                  marginBottom: 4,
                }}
              >
                Akıllı bölme ile tasarruf
              </div>

              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: "#FFFFFF",
                }}
              >
                ₺{formatPrice(savings)}
              </div>
            </div>

            <div
              style={{
                textAlign: "right",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color:
                    "rgba(255,255,255,0.6)",
                  marginBottom: 4,
                }}
              >
                Toplam ({totalProductQuantity} adet)
              </div>

              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#FFB7B2",
                }}
              >
                ₺{formatPrice(splitTotal)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}