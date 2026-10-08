using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GidaKoprusu.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "organisations",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    kind = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false, defaultValue: "pending"),
                    type = table.Column<string>(type: "text", nullable: true),
                    avatar = table.Column<string>(type: "text", nullable: true),
                    cover = table.Column<string>(type: "text", nullable: true),
                    address = table.Column<string>(type: "text", nullable: true),
                    lat = table.Column<double>(type: "double precision", nullable: true),
                    lng = table.Column<double>(type: "double precision", nullable: true),
                    trust_score = table.Column<int>(type: "integer", nullable: false, defaultValue: 50),
                    total_donated_kg = table.Column<decimal>(type: "numeric", nullable: false, defaultValue: 0m),
                    rating = table.Column<decimal>(type: "numeric", nullable: true),
                    review_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    phone = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_organisations", x => x.id);
                    table.CheckConstraint("ck_organisations_kind", "kind in ('business', 'ngo')");
                    table.CheckConstraint("ck_organisations_status", "status in ('pending', 'active', 'suspended')");
                    table.CheckConstraint("ck_organisations_trust_score", "trust_score between 0 and 100");
                });

            migrationBuilder.CreateTable(
                name: "otp_codes",
                columns: table => new
                {
                    email = table.Column<string>(type: "text", nullable: false),
                    code_hash = table.Column<string>(type: "text", nullable: false),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    attempts = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_otp_codes", x => x.email);
                });

            migrationBuilder.CreateTable(
                name: "listings",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    organisation_id = table.Column<string>(type: "text", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    category = table.Column<string>(type: "text", nullable: true),
                    type = table.Column<string>(type: "text", nullable: false, defaultValue: "discounted"),
                    price_original = table.Column<decimal>(type: "numeric", nullable: false),
                    price_discounted = table.Column<decimal>(type: "numeric", nullable: false),
                    portions_total = table.Column<int>(type: "integer", nullable: false),
                    portions_available = table.Column<int>(type: "integer", nullable: false),
                    pickup_start_time = table.Column<string>(type: "text", nullable: true),
                    pickup_end_time = table.Column<string>(type: "text", nullable: true),
                    image = table.Column<string>(type: "text", nullable: true),
                    allergens = table.Column<List<string>>(type: "text[]", nullable: false),
                    lat = table.Column<double>(type: "double precision", nullable: true),
                    lng = table.Column<double>(type: "double precision", nullable: true),
                    weight_kg = table.Column<decimal>(type: "numeric", nullable: false),
                    co2_reduction_kg = table.Column<decimal>(type: "numeric", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false, defaultValue: "active"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_listings", x => x.id);
                    table.CheckConstraint("ck_listings_portions_available", "portions_available >= 0");
                    table.CheckConstraint("ck_listings_portions_total", "portions_total > 0");
                    table.CheckConstraint("ck_listings_status", "status in ('active', 'archived')");
                    table.CheckConstraint("ck_listings_type", "type in ('free', 'discounted', 'bulk')");
                    table.ForeignKey(
                        name: "fk_listings_organisations_organisation_id",
                        column: x => x.organisation_id,
                        principalTable: "organisations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    email = table.Column<string>(type: "text", nullable: false),
                    role = table.Column<string>(type: "text", nullable: false),
                    organisation_id = table.Column<string>(type: "text", nullable: true),
                    display_name = table.Column<string>(type: "text", nullable: true),
                    avatar_url = table.Column<string>(type: "text", nullable: true),
                    city = table.Column<string>(type: "text", nullable: true),
                    district = table.Column<string>(type: "text", nullable: true),
                    phone = table.Column<string>(type: "text", nullable: true),
                    bio = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_users", x => x.id);
                    table.CheckConstraint("ck_users_role", "role in ('buyer', 'business', 'ngo', 'admin')");
                    table.ForeignKey(
                        name: "fk_users_organisations_organisation_id",
                        column: x => x.organisation_id,
                        principalTable: "organisations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "reservations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    listing_id = table.Column<Guid>(type: "uuid", nullable: true),
                    organisation_id = table.Column<string>(type: "text", nullable: false),
                    listing_title = table.Column<string>(type: "text", nullable: false),
                    image = table.Column<string>(type: "text", nullable: true),
                    portion_count = table.Column<int>(type: "integer", nullable: false),
                    paid_amount = table.Column<decimal>(type: "numeric", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false, defaultValue: "confirmed"),
                    pickup_start_time = table.Column<string>(type: "text", nullable: true),
                    pickup_end_time = table.Column<string>(type: "text", nullable: true),
                    pickup_code = table.Column<string>(type: "text", nullable: false),
                    qr_token = table.Column<string>(type: "text", nullable: false),
                    saved_kg = table.Column<decimal>(type: "numeric", nullable: false),
                    co2_kg = table.Column<decimal>(type: "numeric", nullable: false),
                    saved_amount = table.Column<decimal>(type: "numeric", nullable: false),
                    listing_created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_reservations", x => x.id);
                    table.CheckConstraint("ck_reservations_portion_count", "portion_count > 0");
                    table.CheckConstraint("ck_reservations_status", "status in ('confirmed', 'completed', 'cancelled')");
                    table.ForeignKey(
                        name: "fk_reservations_listings_listing_id",
                        column: x => x.listing_id,
                        principalTable: "listings",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_reservations_organisations_organisation_id",
                        column: x => x.organisation_id,
                        principalTable: "organisations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_reservations_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "reviews",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    reservation_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    organisation_id = table.Column<string>(type: "text", nullable: false),
                    author_name = table.Column<string>(type: "text", nullable: false),
                    rating = table.Column<int>(type: "integer", nullable: false),
                    comment = table.Column<string>(type: "text", nullable: true),
                    tags = table.Column<List<string>>(type: "text[]", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_reviews", x => x.id);
                    table.CheckConstraint("ck_reviews_comment", "char_length(comment) <= 500");
                    table.CheckConstraint("ck_reviews_rating", "rating between 1 and 5");
                    table.ForeignKey(
                        name: "fk_reviews_organisations_organisation_id",
                        column: x => x.organisation_id,
                        principalTable: "organisations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_reviews_reservations_reservation_id",
                        column: x => x.reservation_id,
                        principalTable: "reservations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_reviews_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_listings_organisation_id",
                table: "listings",
                column: "organisation_id");

            migrationBuilder.CreateIndex(
                name: "ix_reservations_listing_id",
                table: "reservations",
                column: "listing_id");

            migrationBuilder.CreateIndex(
                name: "ix_reservations_organisation_id_pickup_code",
                table: "reservations",
                columns: new[] { "organisation_id", "pickup_code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_reservations_qr_token",
                table: "reservations",
                column: "qr_token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_reservations_user_id",
                table: "reservations",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_reviews_organisation_id_created_at",
                table: "reviews",
                columns: new[] { "organisation_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "ix_reviews_reservation_id",
                table: "reviews",
                column: "reservation_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_reviews_user_id",
                table: "reviews",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_users_email",
                table: "users",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_users_organisation_id",
                table: "users",
                column: "organisation_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "otp_codes");

            migrationBuilder.DropTable(
                name: "reviews");

            migrationBuilder.DropTable(
                name: "reservations");

            migrationBuilder.DropTable(
                name: "listings");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "organisations");
        }
    }
}
