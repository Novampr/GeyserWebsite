import Translate from '@docusaurus/Translate';
import HeroBanner from '@site/src/components/HeroBanner';
import HeroBackground from '@site/static/img/site/split-background.webp';
import Layout from '@theme/Layout';
import { useEffect, useRef, useState } from 'react';
import styles from './utilities.module.scss';
import clsx from 'clsx';
import { Reporter, V1ItemsData, V2ItemsData, ItemsV1ToV2 } from './converters';

const MappingMigratorPage: React.FC = () => {
    const [statusMessage, setStatusMessage] = useState('');

    function appendStatusMessage(message: string) {
        if (statusMessage === "") {
            setStatusMessage(message);
        } else {
            setStatusMessage(statusMessage + "\n" + message);
        }
    }

    class StatusReporter implements Reporter {
        reportPotentialIssue(issue: string): void {
            appendStatusMessage(issue);
        }
    }

    const reporter = new StatusReporter();

    function convert() {
        const htmlElement: HTMLElement | null = document.getElementById("mappings");
        if (htmlElement === null) {
            appendStatusMessage("Input box is null, please report this.");
            return;
        }
        const mappingInformation = (htmlElement as HTMLInputElement).value;

        const jsonMappingData = JSON.parse(mappingInformation);
            const formatVersion = jsonMappingData["format_version"];
            if (formatVersion != 1) {
                appendStatusMessage("Format version is not 1.");
                return;
            }

            if ("blocks" in jsonMappingData) {
                appendStatusMessage("Blocks are not supported.");
                return;
            }

            if ("items" in jsonMappingData) {
                const v1data: V1ItemsData = jsonMappingData;
                const v2data: V2ItemsData = (new ItemsV1ToV2()).migrate(v1data, reporter);
                const result: any = v2data;
                result["format_version"] = 2;
                (htmlElement as HTMLInputElement).value = JSON.stringify(result, null, 4);
            }
    }

    return (
        <>
            <HeroBanner
                title={<Translate id='pages.mappingmigrator.title'>Mapping Migrator</Translate>}
                subheading={<Translate id='pages.mappingmigrator.subheading'>Migrate your V1 custom mappings to V2 custom mappings.</Translate>}
                backgroundImage={HeroBackground}
            />

            <h2><Translate id='pages.mappingmigrator.entermappings'>Enter V1 mappings below.</Translate></h2>
            <textarea id='mappings' className={clsx(styles.formInput, styles.noOutline)} placeholder='...' />
            <button className={styles.loadButton} onClick={convert}>
                <Translate id='pages.mappingmigrator.button.migrate'>Migrate</Translate>
            </button>

            {statusMessage !== '' ? (
                            <div className={styles.statusMessage}>
                                <p dangerouslySetInnerHTML={{ __html: statusMessage }} />
                            </div>
                        ) : undefined}
        </>
    );
}

export default function MappingMigrator(): JSX.Element {
    return (
        <Layout
            title={`Mapping Migrator`}
            description='Migrate your V1 custom mappings to V2 custom mappings.'
        >
            <main>
                <div className='container container--fluid margin-vert--lg'>
                    <MappingMigratorPage />
                </div>
            </main>
        </Layout>
    )
}