#include <algorithm>
#include <cmath>
#include <cstdint>
#include <iostream>
#include <string_view>

namespace cosmic {

enum class Stage : std::uint8_t {
  Particle,
  Meteorite,
  Moon,
  Planet,
  Star,
  BlackHole,
  BinarySingularity,
  SupermassiveBlackHole,
  CosmicCollapse
};

struct Body {
  double radius = 1.0;
  double mass = 1.0;
  bool fragment = false;
};

struct CollisionResult {
  bool can_absorb = false;
  bool can_damage_player = false;
  bool should_orbit = false;
  int score_award = 0;
};

constexpr bool IsBlackHoleLike(Stage stage) {
  return stage == Stage::BlackHole ||
         stage == Stage::BinarySingularity ||
         stage == Stage::SupermassiveBlackHole ||
         stage == Stage::CosmicCollapse;
}

constexpr bool IsOrbitalStage(Stage stage) {
  return stage == Stage::Moon ||
         stage == Stage::Planet ||
         stage == Stage::Star ||
         IsBlackHoleLike(stage);
}

double GravityRadius(Stage stage, const Body& player) {
  const double stage_multiplier = IsBlackHoleLike(stage) ? 9.4 : IsOrbitalStage(stage) ? 7.2 : 4.8;
  return std::max(72.0, player.radius * stage_multiplier + std::sqrt(player.mass) * 16.0);
}

CollisionResult EvaluateCollision(Stage stage, const Body& player, const Body& incoming) {
  const bool black_hole = IsBlackHoleLike(stage);
  const bool smaller_by_size = incoming.radius <= player.radius * (black_hole ? 2.35 : 0.96);
  const bool smaller_by_mass = incoming.mass <= player.mass * (black_hole ? 4.25 : 1.05);
  const bool can_absorb = smaller_by_size || smaller_by_mass || incoming.fragment || black_hole;
  const bool dangerous = incoming.radius > player.radius * 1.08 || incoming.mass > player.mass * 1.05;
  const bool should_orbit = IsOrbitalStage(stage) && can_absorb && !black_hole;

  const int score = can_absorb
    ? static_cast<int>(std::round((incoming.radius + incoming.mass * 6.0) * (black_hole ? 1.35 : 1.0)))
    : 0;

  return {
    can_absorb,
    dangerous && !can_absorb,
    should_orbit,
    std::max(0, score)
  };
}

std::string_view StageName(Stage stage) {
  switch (stage) {
    case Stage::Particle: return "Big Bang Particle";
    case Stage::Meteorite: return "Meteorite";
    case Stage::Moon: return "Natural Satellite";
    case Stage::Planet: return "Planet";
    case Stage::Star: return "Star";
    case Stage::BlackHole: return "Black Hole";
    case Stage::BinarySingularity: return "Binary Singularity";
    case Stage::SupermassiveBlackHole: return "Supermassive Black Hole";
    case Stage::CosmicCollapse: return "Cosmic Collapse";
  }
  return "Unknown";
}

}  // namespace cosmic

int main() {
  const cosmic::Body player{40.0, 3.3, false};
  const cosmic::Body meteor{18.0, 1.0, false};
  const auto stage = cosmic::Stage::Star;
  const auto result = cosmic::EvaluateCollision(stage, player, meteor);

  std::cout << "Stage: " << cosmic::StageName(stage) << '\n';
  std::cout << "Gravity radius: " << cosmic::GravityRadius(stage, player) << '\n';
  std::cout << "Absorb: " << result.can_absorb << '\n';
  std::cout << "Orbit: " << result.should_orbit << '\n';
  std::cout << "Damage player: " << result.can_damage_player << '\n';
  std::cout << "Score award: " << result.score_award << '\n';
  return 0;
}
