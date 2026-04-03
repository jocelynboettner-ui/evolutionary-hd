// ============================================================
// SYSTEM PROMPT CONCATENATION SCRIPT
// File: build-system-prompt.js
// USAGE IN server.js: const SYSTEM_PROMPT = require('./build-system-prompt');
// VERIFY build: node build-system-prompt.js
// ============================================================

function safeRequire(path) {
  try {
      const mod = require(path);
          return typeof mod === 'string' ? mod : '';
            } catch (e) {
                console.warn('Could not load: ' + path + ' - ' + e.message);
                    return '';
                      }
                      }

                      const BASE_PROMPT                              = safeRequire('./system-prompt-v3-final');
                      const TENSE_INSTRUCTION                        = safeRequire('./tense-instruction');
                      const CENTER_PDF_ADDITIONS                     = safeRequire('./center-pdf-additions');
                      const SOURCE_MATERIAL_ADDITIONS                = safeRequire('./source-material-additions');
                      const PROFILE_LINES_ADDITION                   = safeRequire('./profile-lines-addition');
                      const GATES_BODYGRAPH_ADDITION                 = safeRequire('./gates-bodygraph-addition');
                      const GATES_BY_CENTER_MAPPING                  = safeRequire('./gates-by-center-mapping');
                      const CHANNELS_CONNECTIONS_ADDITION            = safeRequire('./channels-connections-addition');
                      const CIRCUITS_ADDITION                        = safeRequire('./circuits-addition');
                      const INDIVIDUAL_CHANNELS_ADDITION             = safeRequire('./individual-channels-addition');
                      const TRIBAL_CHANNELS_ADDITION                 = safeRequire('./tribal-channels-addition');
                      const COLLECTIVE_CHANNELS_ADDITION             = safeRequire('./collective-channels-addition');
                      const ADVANCED_INTERPRETATION_ADDITION         = safeRequire('./advanced-interpretation-addition');
                      const DEFINITION_TYPES_ADDITION                = safeRequire('./definition-types-addition');
                      const SPLIT_DEFINITION_ADDITION                = safeRequire('./split-definition-addition');
                      const TRIPLE_QUAD_DEFINITION_ADDITION          = safeRequire('./triple-quad-definition-addition');
                      const STRATEGIC_QUESTIONING_ADDITION           = safeRequire('./strategic-questioning-addition');
                      const LAYER_5_VARIABLES_CROSS_ADDITION         = safeRequire('./layer-5-variables-cross-addition');
                      const LAYER_4_CHANNELS_GATES_ADDITION          = safeRequire('./layer-4-channels-gates-addition');
                      const LAYER_3_CENTERS_ADDITION                 = safeRequire('./layer-3-centers-addition');
                      const CONDITIONING_THEORY_ADDITION             = safeRequire('./conditioning-theory-addition');
                      const SUPPORT_OF_PROCESS_ADDITION              = safeRequire('./support-of-process-addition');
                      const LAYER_2_PROFILE_DEFINITION_ADDITION      = safeRequire('./layer-2-profile-definition-addition');
                      const LAYER_1_TYPE_STRATEGY_AUTHORITY_ADDITION = safeRequire('./layer-1-type-strategy-authority-addition');
                      const STRATEGY_AND_AUTHORITY_IN_ACTION_ADDITION = safeRequire('./strategy-and-authority-in-action-addition');
                      const LAYERED_READING_PROTOCOL_ADDITION        = safeRequire('./layered-reading-protocol-addition');
                      const GLOBAL_CONFIG_ANALYSIS_ADDITION          = safeRequire('./global-config-analysis-addition');
                      const CHANNELS_DATA_ADDITION                   = safeRequire('./channels-data-addition');
                      const GENE_KEYS_TRAITS_ADDITION                = safeRequire('./gene-keys-traits-addition');
                      const CONTINUING_EDUCATION_ADDITION            = safeRequire('./continuing-education-addition');
                      const TOC_PROMPT_SECTIONS                      = safeRequire('./toc-and-prompt-additions');

                      const SYSTEM_PROMPT = [
                        BASE_PROMPT, TENSE_INSTRUCTION, CENTER_PDF_ADDITIONS, SOURCE_MATERIAL_ADDITIONS,
                          PROFILE_LINES_ADDITION, GATES_BODYGRAPH_ADDITION, GATES_BY_CENTER_MAPPING,
                            CHANNELS_CONNECTIONS_ADDITION, CIRCUITS_ADDITION, INDIVIDUAL_CHANNELS_ADDITION,
                              TRIBAL_CHANNELS_ADDITION, COLLECTIVE_CHANNELS_ADDITION, ADVANCED_INTERPRETATION_ADDITION,
                                DEFINITION_TYPES_ADDITION, SPLIT_DEFINITION_ADDITION, TRIPLE_QUAD_DEFINITION_ADDITION,
                                  STRATEGIC_QUESTIONING_ADDITION, LAYER_5_VARIABLES_CROSS_ADDITION,
                                    LAYER_4_CHANNELS_GATES_ADDITION, LAYER_3_CENTERS_ADDITION,
                                      CONDITIONING_THEORY_ADDITION, SUPPORT_OF_PROCESS_ADDITION,
                                        LAYER_2_PROFILE_DEFINITION_ADDITION, LAYER_1_TYPE_STRATEGY_AUTHORITY_ADDITION,
                                          STRATEGY_AND_AUTHORITY_IN_ACTION_ADDITION, LAYERED_READING_PROTOCOL_ADDITION,
                                            GLOBAL_CONFIG_ANALYSIS_ADDITION, CHANNELS_DATA_ADDITION, GENE_KEYS_TRAITS_ADDITION,
                                              CONTINUING_EDUCATION_ADDITION, TOC_PROMPT_SECTIONS,
                                              ].join('');

                                              if (require.main === module) {
                                                const layers = [
                                                    ['BASE_PROMPT', BASE_PROMPT],
                                                        ['TENSE_INSTRUCTION', TENSE_INSTRUCTION],
                                                            ['CENTER_PDF_ADDITIONS', CENTER_PDF_ADDITIONS],
                                                                ['SOURCE_MATERIAL_ADDITIONS', SOURCE_MATERIAL_ADDITIONS],
                                                                    ['PROFILE_LINES_ADDITION', PROFILE_LINES_ADDITION],
                                                                        ['GATES_BODYGRAPH_ADDITION', GATES_BODYGRAPH_ADDITION],
                                                                            ['GATES_BY_CENTER_MAPPING', GATES_BY_CENTER_MAPPING],
                                                                                ['CHANNELS_CONNECTIONS_ADDITION', CHANNELS_CONNECTIONS_ADDITION],
                                                                                    ['CIRCUITS_ADDITION', CIRCUITS_ADDITION],
                                                                                        ['INDIVIDUAL_CHANNELS_ADDITION', INDIVIDUAL_CHANNELS_ADDITION],
                                                                                            ['TRIBAL_CHANNELS_ADDITION', TRIBAL_CHANNELS_ADDITION],
                                                                                                ['COLLECTIVE_CHANNELS_ADDITION', COLLECTIVE_CHANNELS_ADDITION],
                                                                                                    ['ADVANCED_INTERPRETATION_ADDITION', ADVANCED_INTERPRETATION_ADDITION],
                                                                                                        ['DEFINITION_TYPES_ADDITION', DEFINITION_TYPES_ADDITION],
                                                                                                            ['SPLIT_DEFINITION_ADDITION', SPLIT_DEFINITION_ADDITION],
                                                                                                                ['TRIPLE_QUAD_DEFINITION_ADDITION', TRIPLE_QUAD_DEFINITION_ADDITION],
                                                                                                                    ['STRATEGIC_QUESTIONING_ADDITION', STRATEGIC_QUESTIONING_ADDITION],
                                                                                                                        ['LAYER_5_VARIABLES_CROSS_ADDITION', LAYER_5_VARIABLES_CROSS_ADDITION],
                                                                                                                            ['LAYER_4_CHANNELS_GATES_ADDITION', LAYER_4_CHANNELS_GATES_ADDITION],
                                                                                                                                ['LAYER_3_CENTERS_ADDITION', LAYER_3_CENTERS_ADDITION],
                                                                                                                                    ['CONDITIONING_THEORY_ADDITION (new)', CONDITIONING_THEORY_ADDITION],
                                                                                                                                        ['SUPPORT_OF_PROCESS_ADDITION (new)', SUPPORT_OF_PROCESS_ADDITION],
                                                                                                                                            ['LAYER_2_PROFILE_DEFINITION_ADDITION', LAYER_2_PROFILE_DEFINITION_ADDITION],
                                                                                                                                                ['LAYER_1_TYPE_STRATEGY_AUTHORITY_ADDITION', LAYER_1_TYPE_STRATEGY_AUTHORITY_ADDITION],
                                                                                                                                                    ['STRATEGY_AND_AUTHORITY_IN_ACTION_ADDITION (new)', STRATEGY_AND_AUTHORITY_IN_ACTION_ADDITION],
                                                                                                                                                        ['LAYERED_READING_PROTOCOL_ADDITION', LAYERED_READING_PROTOCOL_ADDITION],
                                                                                                                                                            ['GLOBAL_CONFIG_ANALYSIS_ADDITION', GLOBAL_CONFIG_ANALYSIS_ADDITION],
                                                                                                                                                                ['CHANNELS_DATA_ADDITION', CHANNELS_DATA_ADDITION],
                                                                                                                                                                    ['GENE_KEYS_TRAITS_ADDITION', GENE_KEYS_TRAITS_ADDITION],
                                                                                                                                                                        ['CONTINUING_EDUCATION_ADDITION (new)', CONTINUING_EDUCATION_ADDITION],
                                                                                                                                                                            ['TOC_PROMPT_SECTIONS', TOC_PROMPT_SECTIONS],
                                                                                                                                                                              ];
                                                                                                                                                                              
                                                                                                                                                                                const totalChars = SYSTEM_PROMPT.length;
                                                                                                                                                                                  const totalTokensEst = Math.round(totalChars / 4);
                                                                                                                                                                                    let emptyCount = 0;
                                                                                                                                                                                    
                                                                                                                                                                                      console.log('\n========================================');
                                                                                                                                                                                        console.log('  SYSTEM PROMPT BUILD VERIFICATION');
                                                                                                                                                                                          console.log('========================================');
                                                                                                                                                                                          
                                                                                                                                                                                            layers.forEach(([name, val]) => {
                                                                                                                                                                                                const chars = (val || '').length;
                                                                                                                                                                                                    const pct = totalChars > 0 ? ((chars / totalChars) * 100).toFixed(1) : '0.0';
                                                                                                                                                                                                        if (chars === 0) {
                                                                                                                                                                                                              emptyCount++;
                                                                                                                                                                                                                    console.log('  x  ' + name.padEnd(50) + ' EMPTY');
                                                                                                                                                                                                                        } else {
                                                                                                                                                                                                                              console.log('  ok ' + name.padEnd(50) + ' ' + chars.toLocaleString().padStart(8) + ' chars (' + pct + '%)');
                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                    });
                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                      console.log('----------------------------------------');
                                                                                                                                                                                                                                        console.log('  TOTAL: ' + totalChars.toLocaleString() + ' chars (~' + totalTokensEst.toLocaleS
                                                                                                                                                                                                                                            } else {
                                                                                                                                                                                                                                                  console.log('  ok ' + name.padEnd(50) + ' ' + chars.toLocaleString().padStart(8) + ' chars (' + pct + '%)');
                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                        });
                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                          console.log('----------------------------------------');
                                                                                                                                                                                                                                                            console.log('  TOTAL: ' + totalChars.toLocaleString() + ' chars (~' + totalTokensEst.toLocaleString() + ' tokens est.)');
                                                                                                                                                                                                                                                              console.log('========================================');
                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                if (emptyCount > 0) {
                                                                                                                                                                                                                                                                    console.log('\n  WARNING: ' + emptyCount + ' layer(s) empty. Add module.exports to each file.');
                                                                                                                                                                                                                                                                      } else {
                                                                                                                                                                                                                                                                          if (totalTokensEst > 180000) {
                                                                                                                                                                                                                                                                                console.warn('\n  WARNING: Token count >180k - consider trimming lower-priority layers.\n');
                                                                                                                                                                                                                                                                                    } else {
                                                                                                                                                                                                                                                                                          console.log('\n  All layers loaded. Token count healthy.\n');
                                                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                module.exports = SYSTEM_PROMPT;
