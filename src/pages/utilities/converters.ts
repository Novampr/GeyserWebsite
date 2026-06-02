interface Reporter {
    reportPotentialIssue(issue: string): void;
}

//
//
// V1 ITEMS DATA CLASSES
//
//
interface V1ItemsData {
  items: any;
}

interface V1ItemsMapping {
    name: string;
    custom_model_data?: number;
    damage_predicate?: number;
    unbreakable?: boolean;
    display_name?: string;
    icon?: string;
    allow_offhand?: boolean;
    texture_size?: number;
    creative_category?: number;
    creative_group?: string;
    render_offsets?: any; // We don't need specifics here, since we don't actually use any of the data.
    tags?: string[];
}

//
//
// V2 ITEMS DATA CLASSES
//
//
interface V2ItemsData {
  items: any;
}

interface V2ItemsMapping {
    type: string;
    model: string;
    bedrock_identifier: string;
    display_name?: string;
    bedrock_options?: V2ItemsBedrockOptions;
    predicate?: V2ItemsPredicate[];
    predicate_strategy?: "and" | "or";
    priority?: number;
}

interface V2ItemsBedrockOptions {
    icon?: string;
    allow_offhand?: boolean;
    display_handheld?: boolean;
    protection_value?: number;
    creative_category?: string;
    creative_group?: string;
    tags?: string[];
}

interface V2ItemsPredicate {
    type: string;

    // Common
    expected?: boolean;
    property?: string;
    index?: number;

    // Condition
    component?: string;

    // Match
    value?: any;

    // Range Dispatch
    threshold?: number;
    scale?: number;
    normalize?: boolean;
}

interface Migrator {
    from(): number;
    to(): number;
    type(): string;

    migrate(data: any, reporter: Reporter): any;
}

class ItemsV1ToV2 implements Migrator {
    from(): number {
        return 1;
    }
    to(): number {
        return 2;
    }
    type(): string {
        return "items";
    }
    migrate(data: V1ItemsData, reporter: Reporter): V2ItemsData {
        const items: any = {};
        for (const entry of Object.keys(data.items)) {
            const item = [entry, data.items[entry]];
            const javaId = item[0];
            const v1mappings: V1ItemsMapping[] = item[1];
            const v2mappings: V2ItemsMapping[] = [];
            for (const v1mapping of v1mappings) {
                const bedrockId = "geyser_custom:" + v1mapping.name;
                const v2mapping: V2ItemsMapping = {
                    type: "defintion",
                    model: bedrockId,
                    bedrock_identifier: bedrockId
                };
                if (v1mapping.display_name !== undefined) v2mapping.display_name = v1mapping.display_name;

                const v2bedrockOptions: V2ItemsBedrockOptions = {};

                if (v1mapping.icon !== undefined) v2bedrockOptions.icon = v1mapping.icon;
                if (v1mapping.allow_offhand !== undefined) v2bedrockOptions.allow_offhand = v1mapping.allow_offhand;
                if (v1mapping.creative_category !== undefined) {
                    let val: string | undefined;
                    switch (v1mapping.creative_category) {
                        case 0: val = "none"; break;
                        case 1: val = "construction"; break;
                        case 2: val = "nature"; break;
                        case 3: val = "equipment"; break;
                        case 4: val = "items"; break;
                    }
                    if (val !== undefined) v2bedrockOptions.creative_category = val;
                }
                if (v1mapping.creative_group !== undefined) v2bedrockOptions.creative_group = v1mapping.creative_group;
                if (v1mapping.render_offsets !== undefined || v1mapping.texture_size !== undefined) {
                    reporter.reportPotentialIssue(`Render offsets were used for mapping with Java ID: ${javaId}, Bedrock ID: ${bedrockId}! These are not in V2 and were not converted.`);
                }
                if (v1mapping.tags !== undefined) v2bedrockOptions.tags = v1mapping.tags;

                v2mapping.bedrock_options = v2bedrockOptions;

                const predicates: V2ItemsPredicate[] = [];

                if (v1mapping.custom_model_data !== undefined) {
                    predicates.push({
                        type: "range_dispatch",
                        property: "custom_model_data",
                        threshold: v1mapping.custom_model_data,
                        index: 0
                    });
                }
                if (v1mapping.damage_predicate !== undefined) {
                    predicates.push({
                        type: "range_dispatch",
                        property: "damage",
                        threshold: v1mapping.damage_predicate
                    });
                }
                if (v1mapping.unbreakable !== undefined) {
                    predicates.push({
                        type: "condition",
                        property: "has_component",
                        component: "minecraft:unbreakable",
                        expected: v1mapping.unbreakable
                    });
                }

                if (predicates.length === 0) {
                    reporter.reportPotentialIssue(`Mapping with Java ID: ${javaId}, Bedrock ID: ${bedrockId} does not specify custom_model_data, damage_predicate or unbreakable, so no mapping can be made.`);
                    continue;
                }

                v2mapping.predicate = predicates;

                v2mappings.push(v2mapping);
            }
            items[javaId] = v2mappings;
        }
        return {items: items};
    }
}

export {
    Reporter, ItemsV1ToV2, V1ItemsData, V2ItemsData
}