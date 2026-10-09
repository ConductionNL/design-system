# Table sweep inventory, 9 Oct 2026

Generated read-only from `screens-src/**/*.dc.html` on origin/main c0c926f2 by a parser that walks each board's `<x-dc>` tree. A board counts when it draws a `<table>` (or role table/grid), or, without one, a row list with a `Paginering` nav. Toolbar markers: a search form or search input, a button labelled Filter/Filteren, an "Alles wissen" link, and saved-view chips from an `sc-for`. A marker is "inside" when the nearest white card (white background, radius, border or shadow) around the table after it also contains the marker.

## Counts

- Boards with a table or row list: 703 (671 with a `<table>`, 32 row lists)
- Toolbar inside the white card (wrong): 31, partly inside (mixed): 2
- Toolbar on the grey ground (right): 292
- No toolbar at all (detail tables, dashboards, dialogs, settings tables): 378
- Table boards with at least one sort chevron in a header: 64 of 671; with every labelled column chevroned: 0
- Table boards with a column filter icon in a header: 0 (no such icon exists in any board, DqWooVerzoeken included)

Per set: esdoornveen 9, vaartveld 9, warmtepompacademie 8, wilgenboom 7, zuiddrecht 670

## Toolbar inside the white card

| app | board | kind | markers inside | markers outside | header cols | sort chevrons |
|---|---|---|---|---|---|---|
| buildiq | BqFormulierGebruiken | rowlist | filter, search |  | 0 | 0 |
| buildiq | BqSjabloonGebruiken | rowlist | filter, search |  | 0 | 0 |
| buildiq | BqStore | rowlist | filter, search |  | 0 | 0 |
| buildiq | BqStoreFormulieren | rowlist | filter, search |  | 0 | 0 |
| decidiq | DcArchief | table | filter |  | 13 | 0 |
| dossiq | DqTeamwachtrij | rowlist | chips, filter, search, wissen |  | 0 | 0 |
| hermiq | HmAgentBewerken | table | search | chips, search, wissen | 20 | 0 |
| hermiq | HmAlgoritmeregister | table | filter, search |  | 7 | 0 |
| hermiq | HmMcpTools | table | filter, search, wissen |  | 11 | 0 |
| hermiq | HmRichtlijnen | table | search |  | 10 | 0 |
| humaniq | HuBeloningsronde | table | filter |  | 12 | 0 |
| larpinq | LrEvenementInchecken | table | search |  | 5 | 0 |
| pipelinq | PqBiExport | table | chips, filter, search |  | 7 | 0 |
| pipelinq | PqEvenement | table | search |  | 6 | 0 |
| pipelinq | PqFlows | table | chips, search, wissen |  | 5 | 0 |
| pipelinq | PqServices | table | chips, filter, search |  | 7 | 0 |
| pipelinq | PqVerbindingscontrole | table | search |  | 7 | 0 |
| planninq | PlBacklog | table | search |  | 10 | 0 |
| planninq | PlLogboek | table | filter, search |  | 6 | 0 |
| planninq | PlRisicos | table | filter |  | 15 | 0 |
| portaliq | PtMailsjablonen | table | filter |  | 9 | 0 |
| portaliq | PtProducten | table | filter, search |  | 5 | 0 |
| shillinq | ShGrootboek | table | filter | search, wissen | 18 | 0 |
| thematiq | TqBasistokens | table | search |  | 9 | 0 |
| thematiq | TqComponenten | table | search |  | 7 | 0 |
| thematiq | TqGroepen | table | search |  | 3 | 0 |
| thematiq | TqNieuwThema | table | search |  | 7 | 0 |
| thematiq | TqOverridesOpslaan | table | search |  | 10 | 0 |
| thematiq | TqOverridesUploaden | table | search |  | 7 | 0 |
| thematiq | TqTerugNaarNextcloud | table | search |  | 5 | 0 |
| thematiq | TqTheming | table | search |  | 5 | 0 |
| thematiq | TqThemingBijwerken | table | search |  | 8 | 0 |
| thematiq | TqTokensetToepassen | table | search |  | 11 | 0 |

Note: the ten thematiq boards (TqTheming and its dialog backdrops) and HmAgentBewerken carry a search field in the heading row of one section card on a multi-card settings or editor page, not an index list. Whether the index-list rule applies there needs a ruling.

## Toolbar on the grey ground

| app | board | kind | header cols | sort chevrons |
|---|---|---|---|---|
| buildiq | BqAgentBewerken | rowlist | 0 | 0 |
| buildiq | BqAgents | rowlist | 0 | 0 |
| buildiq | BqApps | table | 8 | 1 |
| buildiq | BqAutomatiseringBewerken | rowlist | 0 | 0 |
| buildiq | BqAutomatiseringTesten | table | 2 | 0 |
| buildiq | BqAutomatiseringen | rowlist | 0 | 0 |
| buildiq | BqBedrijfsregels | table | 11 | 0 |
| buildiq | BqBeslistabel | table | 14 | 0 |
| buildiq | BqGenererenMetAI | table | 8 | 1 |
| buildiq | BqInstallatieRapport | table | 3 | 0 |
| buildiq | BqNieuweApp | table | 8 | 1 |
| buildiq | BqNieuweAppControleren | table | 8 | 1 |
| buildiq | BqNieuweAppKeten | table | 8 | 1 |
| buildiq | BqNieuweAppVersies | table | 8 | 1 |
| buildiq | BqRegelBewerken | table | 11 | 0 |
| buildiq | BqRegelsTesten | table | 13 | 0 |
| buildiq | BqSchemaToevoegen | table | 8 | 0 |
| buildiq | BqSchemaVerwijderen | table | 8 | 0 |
| buildiq | BqSchemas | table | 8 | 0 |
| buildiq | BqVersiesExports | table | 8 | 0 |
| decidiq | DcBesluiten | table | 6 | 1 |
| decidiq | DcConsultaties | table | 5 | 0 |
| decidiq | DcExporterenBijlagen | table | 6 | 1 |
| decidiq | DcLangetermijnagenda | table | 6 | 0 |
| decidiq | DcNieuwBesluit | table | 6 | 1 |
| decidiq | DcNieuwOrgaan | table | 4 | 0 |
| decidiq | DcNieuwVoorstel | table | 6 | 1 |
| decidiq | DcNieuweToezegging | table | 5 | 1 |
| decidiq | DcNieuweVergadering | table | 6 | 1 |
| decidiq | DcOrganen | table | 4 | 0 |
| decidiq | DcPCcycli | table | 6 | 0 |
| decidiq | DcSpoedbesluiten | table | 4 | 1 |
| decidiq | DcToezeggingen | table | 5 | 1 |
| decidiq | DcVergaderingen | table | 6 | 1 |
| decidiq | DcVoorstellen | table | 6 | 1 |
| dossiq | DqAanMijToegewezen | rowlist | 0 | 0 |
| dossiq | DqContacten | table | 4 | 1 |
| dossiq | DqContracten | table | 5 | 0 |
| dossiq | DqKlachten | table | 5 | 0 |
| dossiq | DqNieuweZaak | table | 5 | 1 |
| dossiq | DqOrganisaties | table | 7 | 1 |
| dossiq | DqPostvak | table | 4 | 0 |
| dossiq | DqPrivacy | table | 6 | 0 |
| dossiq | DqTaken | table | 6 | 1 |
| dossiq | DqWooVerzoeken | table | 7 | 1 |
| dossiq | DqZaaktypen | table | 5 | 0 |
| dossiq | DqZaken | table | 5 | 1 |
| dossiq | DqZoekresultaten | table | 4 | 0 |
| esdoornveen | LqLijst | table | 5 | 1 |
| esdoornveen | Zoeken | rowlist | 0 | 0 |
| filinq | FqClassificatie | table | 5 | 0 |
| filinq | FqDelen | table | 6 | 0 |
| filinq | FqIntake | table | 6 | 0 |
| filinq | FqMijnDocumenten | table | 6 | 0 |
| filinq | FqPublicaties | table | 6 | 0 |
| filinq | FqSjablonen | table | 7 | 0 |
| filinq | FqWisverzoeken | table | 5 | 0 |
| hermiq | HmAgents | table | 7 | 0 |
| hermiq | HmContexten | table | 7 | 0 |
| hermiq | HmGoedkeuringen | table | 6 | 0 |
| hermiq | HmKoppelingen | table | 5 | 0 |
| hermiq | HmRuns | table | 7 | 0 |
| hermiq | HmSkills | rowlist | 0 | 0 |
| hermiq | HmWinkel | table | 4 | 0 |
| humaniq | HuAangiften | table | 8 | 0 |
| humaniq | HuAanwezigheid | table | 6 | 0 |
| humaniq | HuBedrijfsmiddelen | table | 6 | 0 |
| humaniq | HuMedewerkers | table | 5 | 1 |
| humaniq | HuOpleidingen | table | 7 | 0 |
| humaniq | HuProjecturen | table | 5 | 0 |
| humaniq | HuRapportages | table | 5 | 0 |
| humaniq | HuToetsing | table | 4 | 0 |
| humaniq | HuVacature | table | 9 | 0 |
| humaniq | HuVerlofkalender | table | 0 | 0 |
| humaniq | HuVerlofsaldi | table | 7 | 1 |
| integriq | IqAbonnementen | table | 6 | 0 |
| integriq | IqAppKoppelingen | table | 6 | 0 |
| integriq | IqBerichtenverkeer | table | 7 | 0 |
| integriq | IqBronnen | table | 6 | 0 |
| integriq | IqConsumenten | table | 6 | 0 |
| integriq | IqGebeurtenissen | table | 7 | 0 |
| integriq | IqInkomend | table | 7 | 0 |
| integriq | IqLtiTools | table | 5 | 0 |
| integriq | IqMigraties | table | 8 | 0 |
| integriq | IqNietAfgeleverd | table | 5 | 0 |
| integriq | IqRegels | table | 5 | 0 |
| integriq | IqTaken | table | 6 | 0 |
| integriq | IqUitgaand | table | 7 | 0 |
| integriq | IqWebhooks | table | 6 | 0 |
| integriq | IqWinkel | table | 3 | 0 |
| keepiq | KqApplicatieRegistreren | table | 6 | 0 |
| keepiq | KqApplicaties | table | 6 | 0 |
| keepiq | KqArchief | table | 5 | 0 |
| keepiq | KqBinnengekomen | rowlist | 0 | 0 |
| keepiq | KqBulkDelen | table | 6 | 1 |
| keepiq | KqBulkLabels | table | 6 | 1 |
| keepiq | KqBulkRapport | table | 9 | 1 |
| keepiq | KqBulkVerwijderen | table | 6 | 1 |
| keepiq | KqCertificaatVernieuwen | table | 10 | 0 |
| keepiq | KqCertificaten | table | 10 | 0 |
| keepiq | KqCxpOverdracht | table | 6 | 1 |
| keepiq | KqExportSelectie | table | 6 | 1 |
| keepiq | KqExporteren | table | 6 | 1 |
| keepiq | KqGeheimVragen | table | 6 | 1 |
| keepiq | KqGeheimen | table | 6 | 1 |
| keepiq | KqImporteren | table | 11 | 1 |
| keepiq | KqInstellingen | table | 6 | 1 |
| keepiq | KqIntegraties | table | 5 | 0 |
| keepiq | KqKluisBewerken | table | 8 | 1 |
| keepiq | KqMijnActiviteit | rowlist | 0 | 0 |
| keepiq | KqMijnGegevens | table | 8 | 1 |
| keepiq | KqNieuwBeveiligdBericht | table | 10 | 1 |
| keepiq | KqNieuwGeheim | table | 6 | 1 |
| keepiq | KqNieuwGeheimTypen | table | 6 | 1 |
| keepiq | KqOfflineConflict | table | 6 | 1 |
| keepiq | KqPrullenbak | table | 5 | 0 |
| keepiq | KqSleutelGenereren | table | 6 | 1 |
| keepiq | KqSshSleutel | table | 6 | 1 |
| keepiq | KqTeammap | table | 6 | 1 |
| keepiq | KqVerplaatsen | table | 6 | 1 |
| keepiq | KqVersleuteling | table | 15 | 1 |
| larpinq | LrAanmeldingen | table | 7 | 1 |
| larpinq | LrCast | rowlist | 0 | 0 |
| larpinq | LrFlows | table | 5 | 1 |
| larpinq | LrKarakters | table | 7 | 1 |
| larpinq | LrStore | rowlist | 0 | 0 |
| larpinq | LrWerelden | table | 6 | 0 |
| launchpad | LpStore | rowlist | 0 | 0 |
| learniq | LqAanwezigheidLijst | table | 5 | 0 |
| learniq | LqBeoordelaars | table | 4 | 0 |
| learniq | LqBpvPlaatsingen | table | 7 | 0 |
| learniq | LqCertificaten | table | 6 | 0 |
| learniq | LqCfBeperkingen | table | 6 | 0 |
| learniq | LqCfPartners | table | 5 | 0 |
| learniq | LqCfPrivacyverzoeken | table | 6 | 0 |
| learniq | LqCfTrainingVastleggen | table | 5 | 0 |
| learniq | LqCfVerplichtingen | table | 7 | 0 |
| learniq | LqCfVrijstellingen | table | 7 | 0 |
| learniq | LqCijferInvoeren | table | 6 | 0 |
| learniq | LqCijfers | table | 6 | 0 |
| learniq | LqCoAanmeldingen | table | 6 | 0 |
| learniq | LqDossier | table | 5 | 0 |
| learniq | LqExZaken | table | 6 | 0 |
| learniq | LqGesprekBeschikbaarheid | table | 5 | 0 |
| learniq | LqGroepen | rowlist | 0 | 0 |
| learniq | LqInstellingen | table | 3 | 0 |
| learniq | LqKoppelingen | table | 6 | 0 |
| learniq | LqLeerlingInschrijvingen | table | 6 | 0 |
| learniq | LqLeerlingen | table | 5 | 0 |
| learniq | LqLlAanbod | rowlist | 0 | 0 |
| learniq | LqLlCatalogus | rowlist | 0 | 0 |
| learniq | LqNieuweGroep | rowlist | 0 | 0 |
| learniq | LqNieuweNotitie | table | 5 | 0 |
| learniq | LqStore | rowlist | 0 | 0 |
| learniq | LqTlAanmeldverzoeken | table | 5 | 0 |
| learniq | LqTlAfwijzen | table | 5 | 0 |
| learniq | LqZoMeldingen | table | 5 | 0 |
| learniq | LqZoNieuweNotitie | table | 5 | 0 |
| learniq | LqZoNotities | table | 5 | 0 |
| opencatalogi | OcBegrippen | table | 5 | 0 |
| opencatalogi | OcBewaartermijnen | table | 5 | 0 |
| opencatalogi | OcCatalogi | rowlist | 0 | 0 |
| opencatalogi | OcDirectory | table | 4 | 0 |
| opencatalogi | OcDirectoryToevoegen | table | 4 | 0 |
| opencatalogi | OcJsonUploaden | table | 6 | 0 |
| opencatalogi | OcListingBewerken | table | 4 | 0 |
| opencatalogi | OcListingVerwijderen | table | 4 | 0 |
| opencatalogi | OcMassaActies | table | 6 | 0 |
| opencatalogi | OcMigreren | table | 8 | 0 |
| opencatalogi | OcNieuweCatalogus | rowlist | 0 | 0 |
| opencatalogi | OcNieuwePublicatie | table | 6 | 0 |
| opencatalogi | OcPublicatieBestanden | table | 10 | 0 |
| opencatalogi | OcPublicatieKopieren | table | 6 | 0 |
| opencatalogi | OcPublicatieVerwijderen | table | 6 | 0 |
| opencatalogi | OcPublicaties | table | 6 | 0 |
| opencatalogi | OcPublicatiesSchemas | table | 6 | 0 |
| opencatalogi | OcPubliceren | table | 6 | 0 |
| opencatalogi | OcSamenvoegen | table | 11 | 0 |
| opencatalogi | OcTermijnVerlengen | table | 5 | 0 |
| opencatalogi | OcThemas | table | 5 | 0 |
| opencatalogi | OcWooBatchAanmaken | table | 5 | 0 |
| opencatalogi | OcWooBatches | table | 5 | 0 |
| opencatalogi | OcWooVerzoeken | table | 7 | 0 |
| openregister | OrAgents | table | 9 | 0 |
| openregister | OrAuditTrails | table | 9 | 0 |
| openregister | OrAvg | table | 6 | 0 |
| openregister | OrAvgVerzoeken | table | 7 | 0 |
| openregister | OrBestanden | table | 5 | 0 |
| openregister | OrBronnen | table | 6 | 0 |
| openregister | OrConfiguraties | table | 6 | 0 |
| openregister | OrDuplicaten | table | 8 | 0 |
| openregister | OrEntiteiten | table | 7 | 0 |
| openregister | OrImporteren | table | 4 | 0 |
| openregister | OrObjecten | table | 7 | 0 |
| openregister | OrOrganisaties | table | 6 | 0 |
| openregister | OrPrullenbak | table | 5 | 0 |
| openregister | OrRegisters | rowlist | 0 | 0 |
| openregister | OrRoadmap | table | 5 | 0 |
| openregister | OrTaken | table | 5 | 0 |
| openregister | OrWebhooks | table | 8 | 0 |
| pipelinq | PqAanvraagOmzetten | table | 7 | 0 |
| pipelinq | PqAanvragen | table | 7 | 0 |
| pipelinq | PqAfspraken | table | 6 | 0 |
| pipelinq | PqArtikelen | table | 4 | 0 |
| pipelinq | PqCampagnes | table | 5 | 0 |
| pipelinq | PqContacten | table | 6 | 0 |
| pipelinq | PqContactenImporteren | table | 6 | 0 |
| pipelinq | PqContactmomenten | table | 8 | 0 |
| pipelinq | PqContracten | table | 7 | 0 |
| pipelinq | PqImporteren | table | 9 | 0 |
| pipelinq | PqInkomendGesprek | table | 3 | 0 |
| pipelinq | PqJourneys | table | 4 | 0 |
| pipelinq | PqKassaAudit | table | 6 | 0 |
| pipelinq | PqKassabonnen | table | 13 | 0 |
| pipelinq | PqKassadiensten | table | 8 | 0 |
| pipelinq | PqKlantNieuw | table | 5 | 0 |
| pipelinq | PqLeads | table | 7 | 0 |
| pipelinq | PqNieuwVerzoek | table | 7 | 0 |
| pipelinq | PqNieuwsbriefWizard | table | 7 | 0 |
| pipelinq | PqNieuwsbrieven | table | 7 | 0 |
| pipelinq | PqOperationeel | table | 5 | 0 |
| pipelinq | PqOrganisaties | table | 9 | 1 |
| pipelinq | PqOrganisatiesVerrijken | table | 15 | 1 |
| pipelinq | PqProducten | table | 7 | 0 |
| pipelinq | PqProspects | table | 6 | 0 |
| pipelinq | PqSegmentBouwer | table | 4 | 0 |
| pipelinq | PqSjablonen | table | 4 | 0 |
| pipelinq | PqSocial | table | 12 | 0 |
| pipelinq | PqTaken | table | 6 | 0 |
| pipelinq | PqTickets | table | 7 | 0 |
| pipelinq | PqTicketsSelectie | table | 8 | 0 |
| pipelinq | PqZRapporten | table | 7 | 0 |
| planninq | PlBorden | rowlist | 0 | 0 |
| planninq | PlMijnTaken | table | 5 | 1 |
| planninq | PlNieuwProject | table | 6 | 1 |
| planninq | PlProjecten | table | 6 | 1 |
| planninq | PlRoosterscenario | table | 18 | 0 |
| planninq | PlRoosterwensen | table | 21 | 0 |
| portaliq | MijnTakenTabel | table | 3 | 0 |
| portaliq | MijnZakenTabel | table | 5 | 0 |
| portaliq | PtAanvraagformulieren | table | 6 | 0 |
| portaliq | PtAccountUitgeven | table | 5 | 0 |
| portaliq | PtAccounts | table | 5 | 0 |
| portaliq | PtBegrippen | table | 3 | 0 |
| portaliq | PtFormulierInsluiten | table | 6 | 0 |
| portaliq | PtInzendingen | table | 4 | 0 |
| portaliq | PtMededelingen | table | 4 | 1 |
| portaliq | PtMededelingenActies | table | 4 | 1 |
| portaliq | PtMedia | rowlist | 0 | 0 |
| portaliq | PtNieuws | table | 5 | 0 |
| portaliq | PtNieuwsbericht | table | 5 | 0 |
| portaliq | PtPortal | table | 4 | 1 |
| portaliq | PtPortals | table | 7 | 0 |
| portaliq | PtSessies | table | 6 | 0 |
| portaliq | PtToegangsverzoeken | table | 5 | 1 |
| portaliq | PtUitnodigen | table | 6 | 0 |
| portaliq | PtUitnodigingen | table | 6 | 0 |
| portaliq | Zoeken | rowlist | 0 | 0 |
| shillinq | ShAdministraties | table | 2 | 0 |
| shillinq | ShDebiteurenbeheer | table | 7 | 0 |
| shillinq | ShDeclaraties | table | 8 | 0 |
| shillinq | ShFactuurGenereren | table | 22 | 0 |
| shillinq | ShInkoopfacturen | table | 7 | 0 |
| shillinq | ShLeveranciers | table | 11 | 0 |
| shillinq | ShRapporten | table | 3 | 0 |
| shillinq | ShVerkoopfacturen | table | 7 | 0 |
| stackiq | SkApplicatie | table | 8 | 0 |
| stackiq | SkApplicaties | table | 6 | 0 |
| stackiq | SkCmdb | table | 5 | 0 |
| stackiq | SkContracten | table | 8 | 0 |
| stackiq | SkFunctiesRoadmap | table | 4 | 0 |
| stackiq | SkInGebruik | table | 7 | 0 |
| stackiq | SkKoppelingen | table | 6 | 0 |
| stackiq | SkKwetsbaarheden | table | 6 | 0 |
| stackiq | SkModelleren | table | 5 | 0 |
| stackiq | SkOrganisaties | table | 6 | 0 |
| stackiq | SkPubliek | rowlist | 0 | 0 |
| stackiq | SkStandaarden | table | 8 | 0 |
| stackiq | SkSuiteWizard | table | 3 | 0 |
| thematiq | TqMerkPerApp | table | 4 | 0 |
| thematiq | TqVoorbeeldSessie | table | 5 | 1 |
| vaartveld | LqLijst | table | 5 | 1 |
| vaartveld | Zoeken | rowlist | 0 | 0 |
| versioniq | VqApps | table | 6 | 0 |
| versioniq | VqBeveiligingsadviezen | table | 5 | 0 |
| versioniq | VqHistorie | table | 5 | 0 |
| versioniq | VqInstalleren | table | 6 | 0 |
| versioniq | VqVersieTerugzetten | table | 9 | 0 |
| warmtepompacademie | LqLijst | table | 5 | 1 |
| warmtepompacademie | Zoeken | rowlist | 0 | 0 |
| wilgenboom | LqLijst | table | 6 | 1 |
| wilgenboom | Zoeken | rowlist | 0 | 0 |

## Table without a toolbar

| app | board | header cols | sort chevrons |
|---|---|---|---|
| analyse | Acties | 6 | 0 |
| buildiq | BqApp | 4 | 0 |
| buildiq | BqAppActies | 4 | 0 |
| buildiq | BqAppBereik | 11 | 0 |
| buildiq | BqAppInstellingen | 4 | 0 |
| buildiq | BqAppKopieren | 4 | 0 |
| buildiq | BqAppVerwijderen | 4 | 0 |
| buildiq | BqAppWerking | 15 | 0 |
| buildiq | BqBrekendeWijziging | 8 | 0 |
| buildiq | BqBuildiqInstellen | 5 | 0 |
| buildiq | BqDashboard | 5 | 0 |
| buildiq | BqDataImporteren | 9 | 0 |
| buildiq | BqDataImporterenDoel | 4 | 0 |
| buildiq | BqDataImporterenResultaat | 7 | 0 |
| buildiq | BqDocumentSjabloonKoppelen | 2 | 0 |
| buildiq | BqEigenLaagBewerken | 5 | 0 |
| buildiq | BqExporteren | 4 | 0 |
| buildiq | BqExporterenZelfstandig | 7 | 0 |
| buildiq | BqGeplandeTaak | 2 | 0 |
| buildiq | BqGitHub | 4 | 0 |
| buildiq | BqManifestlagen | 5 | 0 |
| buildiq | BqOntwerperKoppelingen | 2 | 0 |
| buildiq | BqOpslaanAlsSjabloon | 4 | 0 |
| buildiq | BqPaginaOntwerperFouten | 4 | 0 |
| buildiq | BqPublicerenGitHub | 4 | 0 |
| buildiq | BqPublicerenZonderRepo | 4 | 0 |
| buildiq | BqRapportages | 4 | 0 |
| buildiq | BqRechtenBeheren | 4 | 0 |
| buildiq | BqRechtengeschiedenis | 4 | 0 |
| buildiq | BqRepoKoppelen | 4 | 0 |
| buildiq | BqSchema | 6 | 0 |
| buildiq | BqSupportBewerken | 4 | 0 |
| buildiq | BqTerugzetten | 8 | 0 |
| buildiq | BqThemaKiezen | 2 | 0 |
| buildiq | BqVeldBewerken | 6 | 0 |
| buildiq | BqVeldVerwijderen | 6 | 0 |
| buildiq | BqVersiePromoveren | 5 | 0 |
| buildiq | BqZaaktypeKoppelen | 2 | 0 |
| decidiq | DcAdhocOverleg | 4 | 0 |
| decidiq | DcAgendapunt | 3 | 0 |
| decidiq | DcAgendapuntMoties | 3 | 0 |
| decidiq | DcAgendapuntStukken | 3 | 0 |
| decidiq | DcAuditverklaring | 3 | 0 |
| decidiq | DcBeheer | 7 | 0 |
| decidiq | DcBeheerSysteem | 8 | 0 |
| decidiq | DcBesluitActiepunten | 4 | 0 |
| decidiq | DcBesluitConsultatie | 12 | 0 |
| decidiq | DcBesluitPublicatie | 3 | 0 |
| decidiq | DcBesluitRoute | 3 | 0 |
| decidiq | DcBudgetronde | 6 | 0 |
| decidiq | DcDashboard | 3 | 0 |
| decidiq | DcDoel | 8 | 0 |
| decidiq | DcMijnInstellingen | 6 | 0 |
| decidiq | DcOrgaan | 4 | 0 |
| decidiq | DcPersoon | 5 | 0 |
| decidiq | DcPubliekeConsultatie | 4 | 0 |
| decidiq | DcReeksBewerken | 3 | 0 |
| decidiq | DcSchriftelijkBesluit | 4 | 0 |
| decidiq | DcStemmenInvoeren | 3 | 0 |
| decidiq | DcStemuitslag | 9 | 0 |
| decidiq | DcVergaderingBesluiten | 13 | 0 |
| decidiq | DcVergaderingDeelnemers | 7 | 0 |
| decidiq | DcVergaderkalender | 7 | 0 |
| decidiq | DcVoorkeursstemming | 3 | 0 |
| decidiq | DcVoorstelOndertekenaars | 4 | 0 |
| decidiq | DcZelfevaluatie | 4 | 0 |
| dossiq | DqAanbesteding | 6 | 0 |
| dossiq | DqAfdelingen | 4 | 0 |
| dossiq | DqCatalogus | 4 | 0 |
| dossiq | DqDocumentenBeheer | 3 | 0 |
| dossiq | DqHandhaving | 4 | 0 |
| dossiq | DqInstellingen | 4 | 0 |
| dossiq | DqProcesanalyse | 5 | 0 |
| dossiq | DqSociaalDomein | 4 | 0 |
| dossiq | DqSubsidie | 5 | 0 |
| dossiq | DqTenant | 7 | 0 |
| dossiq | DqTermijnen | 5 | 0 |
| dossiq | DqVthInstellingen | 8 | 0 |
| dossiq | DqZaakAssistent | 5 | 0 |
| dossiq | DqZaakContact | 4 | 0 |
| dossiq | DqZaakGerelateerd | 9 | 0 |
| dossiq | DqZaakTaken | 4 | 0 |
| dossiq | DqZaaktype | 3 | 0 |
| dossiq | DqZaaktypeOverzicht | 5 | 0 |
| dossiq | DqZaaktypeVelden | 9 | 0 |
| esdoornveen | Artikel | 6 | 0 |
| esdoornveen | Contentpagina | 6 | 0 |
| esdoornveen | Detail | 4 | 0 |
| esdoornveen | LqDetail | 5 | 0 |
| esdoornveen | Main | 3 | 0 |
| esdoornveen | MijnLijst | 5 | 0 |
| esdoornveen | Nodig | 5 | 0 |
| filinq | FqAnonimiseren | 5 | 0 |
| filinq | FqBewaren | 5 | 0 |
| filinq | FqDossier | 4 | 0 |
| filinq | FqHandtekeningControleren | 3 | 0 |
| filinq | FqInstellingen | 2 | 0 |
| filinq | FqInvoerkanalen | 6 | 0 |
| filinq | FqMapAnalyse | 5 | 0 |
| filinq | FqOndertekenmap | 5 | 0 |
| filinq | FqOndertekenverzoek | 4 | 0 |
| filinq | FqPublicatiebeleid | 5 | 0 |
| filinq | FqVersies | 5 | 0 |
| filinq | FqZaakDocumenten | 5 | 0 |
| filinq | FqZienswijze | 3 | 0 |
| filinq | FqZoeken | 5 | 0 |
| hermiq | HmAgent | 10 | 0 |
| hermiq | HmBeheer | 10 | 0 |
| hermiq | HmCompliance | 17 | 0 |
| hermiq | HmEvaluatie | 4 | 0 |
| hermiq | HmGeheugen | 5 | 0 |
| hermiq | HmMijnInstellingen | 9 | 0 |
| hermiq | HmPlanning | 10 | 0 |
| hermiq | HmRunsVergelijken | 7 | 0 |
| hermiq | HmSkill | 4 | 0 |
| hermiq | HmTenantOps | 17 | 0 |
| hermiq | HmToezicht | 4 | 0 |
| hermiq | HmWerkenMetAi | 2 | 0 |
| huisstijl | Main | 3 | 0 |
| humaniq | HuAgenda | 0 | 0 |
| humaniq | HuAvgVerzoek | 10 | 0 |
| humaniq | HuCao | 15 | 0 |
| humaniq | HuDashboard | 8 | 0 |
| humaniq | HuDeclaratie | 4 | 0 |
| humaniq | HuEnquete | 10 | 0 |
| humaniq | HuFormatie | 22 | 0 |
| humaniq | HuGebruikelijkLoon | 6 | 0 |
| humaniq | HuGesprekscyclus | 5 | 0 |
| humaniq | HuInstellingen | 12 | 0 |
| humaniq | HuInwerken | 7 | 0 |
| humaniq | HuKoppelingen | 10 | 0 |
| humaniq | HuLoonpakketten | 9 | 0 |
| humaniq | HuMedewerker | 9 | 0 |
| humaniq | HuMedewerkerDossier | 7 | 0 |
| humaniq | HuMedewerkerSalaris | 11 | 0 |
| humaniq | HuMijnAfdeling | 9 | 0 |
| humaniq | HuMijnGoedkeuringen | 4 | 0 |
| humaniq | HuMijnHr | 3 | 0 |
| humaniq | HuProformaLoonstrook | 7 | 0 |
| humaniq | HuRelatiezaak | 8 | 0 |
| humaniq | HuRooster | 0 | 0 |
| humaniq | HuSalarisBetalen | 9 | 0 |
| humaniq | HuSalarisrun | 12 | 0 |
| humaniq | HuSollicitatie | 9 | 0 |
| humaniq | HuUitdienst | 4 | 0 |
| humaniq | HuUrenstaat | 4 | 0 |
| humaniq | HuVerlofaanvraag | 4 | 0 |
| humaniq | HuWkr | 8 | 0 |
| integriq | IqApiProduct | 9 | 0 |
| integriq | IqBeheerKoppelingen | 5 | 0 |
| integriq | IqBeheerinstellingen | 11 | 0 |
| integriq | IqBron | 4 | 0 |
| integriq | IqDashboard | 5 | 0 |
| integriq | IqEersteInstallatie | 5 | 0 |
| integriq | IqEndpoint | 3 | 0 |
| integriq | IqGesynchroniseerdVan | 3 | 0 |
| integriq | IqGezondheid | 6 | 0 |
| integriq | IqGoedkeuring | 7 | 0 |
| integriq | IqLogboek | 8 | 0 |
| integriq | IqMapping | 3 | 0 |
| integriq | IqOntwikkelaarsportaal | 5 | 0 |
| keepiq | KqApplicatie | 5 | 0 |
| keepiq | KqBeheerAlgemeen | 4 | 0 |
| keepiq | KqBeheerAudit | 19 | 0 |
| keepiq | KqBeheerMensen | 6 | 0 |
| keepiq | KqComplianceMomentopname | 19 | 0 |
| keepiq | KqItemtypeBewerken | 4 | 0 |
| keepiq | KqRootVernieuwen | 4 | 0 |
| larpinq | LrDashboard | 5 | 0 |
| larpinq | LrEvenement | 4 | 0 |
| larpinq | LrFactie | 3 | 0 |
| larpinq | LrKarakterStatistieken | 11 | 1 |
| larpinq | LrPortaalRegelboek | 6 | 0 |
| larpinq | LrRapportages | 5 | 0 |
| larpinq | LrSpeler | 4 | 0 |
| larpinq | LrSpelinstellingen | 3 | 0 |
| larpinq | LrToestand | 5 | 0 |
| larpinq | LrVaardigheid | 5 | 0 |
| larpinq | LrXpToekennen | 8 | 0 |
| launchpad | LpBeheerAnalyse | 7 | 0 |
| launchpad | LpBeheerRollen | 5 | 0 |
| launchpad | LpBeheerSjablonen | 5 | 0 |
| launchpad | LpLeesbevestigingen | 3 | 0 |
| launchpad | LpManagement | 5 | 0 |
| launchpad | LpVersies | 3 | 0 |
| learniq | LqAccountsSamenvoegen | 10 | 0 |
| learniq | LqAgendaAbonneren | 0 | 0 |
| learniq | LqAppInstellingen | 2 | 0 |
| learniq | LqBeheerRechten | 32 | 0 |
| learniq | LqBpvPlaatsing | 14 | 0 |
| learniq | LqBsaBesluit | 4 | 0 |
| learniq | LqCfAiVerwerking | 5 | 0 |
| learniq | LqCfAuditpakket | 6 | 0 |
| learniq | LqCfGroepInschrijven | 2 | 0 |
| learniq | LqCfPrivacygovernance | 3 | 0 |
| learniq | LqCfToegankelijkheid | 12 | 0 |
| learniq | LqCijferlijst | 5 | 0 |
| learniq | LqCoContacturen | 11 | 0 |
| learniq | LqCoPlanbord | 4 | 0 |
| learniq | LqCoToetsweek | 8 | 0 |
| learniq | LqCursusInstellingen | 5 | 0 |
| learniq | LqDekkingsmatrix | 8 | 0 |
| learniq | LqGroepsplan | 11 | 0 |
| learniq | LqGroepstrend | 3 | 0 |
| learniq | LqItemanalyse | 2 | 0 |
| learniq | LqItembank | 5 | 0 |
| learniq | LqLeerplan | 10 | 0 |
| learniq | LqLes | 6 | 0 |
| learniq | LqLesBeheren | 0 | 0 |
| learniq | LqLesNotitie | 0 | 0 |
| learniq | LqLesmap | 5 | 0 |
| learniq | LqLessen | 15 | 0 |
| learniq | LqLlCijfers | 3 | 0 |
| learniq | LqLlLeerdossier | 8 | 0 |
| learniq | LqLlRooster | 0 | 0 |
| learniq | LqOpdracht | 4 | 0 |
| learniq | LqOuLeerdossier | 7 | 0 |
| learniq | LqOuRooster | 0 | 0 |
| learniq | LqRapportvergadering | 6 | 0 |
| learniq | LqRooster | 0 | 0 |
| learniq | LqSchooljaar | 7 | 0 |
| learniq | LqSchoolkosten | 5 | 0 |
| learniq | LqStudievoortgang | 5 | 0 |
| learniq | LqTeamResultaten | 4 | 0 |
| learniq | LqTlVandaag | 11 | 0 |
| learniq | LqToetsNakijken | 3 | 0 |
| learniq | LqVerzuimgrens | 4 | 0 |
| learniq | LqZoVandaag | 3 | 0 |
| opencatalogi | OcBijlageToevoegen | 4 | 0 |
| opencatalogi | OcCatalogusBeheer | 10 | 0 |
| opencatalogi | OcDienstencatalogus | 8 | 0 |
| opencatalogi | OcPublicatieData | 8 | 0 |
| opencatalogi | OcPublicatieInzage | 3 | 0 |
| opencatalogi | OcPublicatiebeleid | 9 | 0 |
| opencatalogi | OcRapportCatalogi | 3 | 0 |
| opencatalogi | OcRapportGebruik | 3 | 0 |
| opencatalogi | OcRapportPublicaties | 3 | 0 |
| opencatalogi | OcWooVerplichtingen | 8 | 0 |
| opencatalogi | OcZaaktypeSynchroniseren | 4 | 0 |
| openregister | OrArchivering | 4 | 0 |
| openregister | OrAvgVerzoek | 7 | 0 |
| openregister | OrBeheerinstellingen | 7 | 0 |
| openregister | OrEigenschap | 7 | 0 |
| openregister | OrFlow | 0 | 0 |
| openregister | OrFlowOverzicht | 6 | 0 |
| openregister | OrGoudenRecord | 4 | 0 |
| openregister | OrKoppelingen | 5 | 0 |
| openregister | OrMijnAccount | 8 | 0 |
| openregister | OrRegister | 6 | 0 |
| openregister | OrSchema | 4 | 0 |
| pipelinq | PqAfspraak | 5 | 0 |
| pipelinq | PqAfspraakVerplaatsen | 5 | 0 |
| pipelinq | PqBeheer | 2 | 0 |
| pipelinq | PqBeheerKassa | 14 | 0 |
| pipelinq | PqBeheerKoppelingen | 7 | 0 |
| pipelinq | PqBeheerMarketing | 5 | 0 |
| pipelinq | PqBeheerPortaal | 11 | 0 |
| pipelinq | PqCampagne | 6 | 0 |
| pipelinq | PqContactpersoon | 5 | 0 |
| pipelinq | PqContract | 4 | 0 |
| pipelinq | PqForecast | 12 | 0 |
| pipelinq | PqInloop | 5 | 0 |
| pipelinq | PqJourney | 4 | 0 |
| pipelinq | PqKassa | 14 | 0 |
| pipelinq | PqKassaAfrekenen | 14 | 0 |
| pipelinq | PqKassaRetour | 7 | 0 |
| pipelinq | PqKassabon | 6 | 0 |
| pipelinq | PqKassadienst | 4 | 0 |
| pipelinq | PqLead | 11 | 0 |
| pipelinq | PqLoyaliteit | 2 | 0 |
| pipelinq | PqMailinglijst | 5 | 0 |
| pipelinq | PqNieuwsbriefPrestaties | 14 | 0 |
| pipelinq | PqOfferte | 6 | 0 |
| pipelinq | PqPersoonlijk | 3 | 0 |
| pipelinq | PqPipelines | 6 | 0 |
| pipelinq | PqProduct | 16 | 0 |
| pipelinq | PqProject | 11 | 0 |
| pipelinq | PqResource | 6 | 0 |
| pipelinq | PqService | 6 | 0 |
| pipelinq | PqSocialBericht | 4 | 0 |
| pipelinq | PqTicketContactmomenten | 4 | 0 |
| pipelinq | PqZRapport | 5 | 0 |
| pipelinq | PqZoekinzicht | 21 | 0 |
| planninq | PlBeheer | 25 | 0 |
| planninq | PlFinancien | 7 | 0 |
| planninq | PlPortfolio | 23 | 0 |
| planninq | PlProjectOverzicht | 9 | 0 |
| planninq | PlRapporten | 20 | 0 |
| portaliq | ActieBewerken | 4 | 0 |
| portaliq | Contact | 6 | 0 |
| portaliq | Contentpagina | 3 | 0 |
| portaliq | Cookieverklaring | 7 | 0 |
| portaliq | Machtigen | 4 | 0 |
| portaliq | Machtigingen | 4 | 0 |
| portaliq | MijnAccount | 5 | 0 |
| portaliq | MijnAccountZonderDigid | 4 | 0 |
| portaliq | MijnAdres | 7 | 0 |
| portaliq | Plan | 4 | 0 |
| portaliq | PtAccount | 7 | 0 |
| portaliq | PtBeheerdersrechten | 9 | 0 |
| portaliq | PtBeschikbaarheid | 6 | 0 |
| portaliq | PtGedeeldeBibliotheek | 5 | 0 |
| portaliq | PtOpdrachtnemerProjecten | 9 | 0 |
| portaliq | PtPortalInstellingen | 8 | 0 |
| portaliq | PtStemgedrag | 4 | 0 |
| portaliq | PtThemas | 3 | 0 |
| portaliq | PtVerkeer | 26 | 0 |
| portaliq | PtVoorstelBeoordelen | 6 | 0 |
| portaliq | PtZaaktypeWeergave | 14 | 0 |
| shillinq | ShAccountant | 5 | 0 |
| shillinq | ShActief | 4 | 0 |
| shillinq | ShAfsluiten | 17 | 0 |
| shillinq | ShAfspraken | 9 | 0 |
| shillinq | ShBank | 5 | 0 |
| shillinq | ShBegroting | 11 | 0 |
| shillinq | ShBelastingen | 5 | 0 |
| shillinq | ShBetaalrun | 5 | 0 |
| shillinq | ShBtwAangifte | 4 | 0 |
| shillinq | ShControle | 5 | 0 |
| shillinq | ShDashboard | 5 | 0 |
| shillinq | ShFactuurImporteren | 9 | 0 |
| shillinq | ShInkooporder | 5 | 0 |
| shillinq | ShInstellingen | 6 | 0 |
| shillinq | ShKlant | 6 | 0 |
| shillinq | ShLiquiditeit | 8 | 0 |
| shillinq | ShMemoriaal | 6 | 0 |
| shillinq | ShOverheid | 15 | 0 |
| shillinq | ShVerkoopfactuur | 5 | 0 |
| shillinq | ShVerslaggeving | 18 | 0 |
| shillinq | ShVoorraad | 9 | 0 |
| shillinq | ShWinstEnVerlies | 9 | 0 |
| stackiq | SkBeheerToegang | 8 | 0 |
| stackiq | SkComplianceMatrix | 11 | 0 |
| stackiq | SkDatakwaliteit | 10 | 0 |
| stackiq | SkGebruikDetail | 8 | 0 |
| stackiq | SkGemmaPlaat | 3 | 0 |
| stackiq | SkInstellingenUitwisseling | 9 | 0 |
| stackiq | SkLicenties | 10 | 0 |
| stackiq | SkModuleversie | 5 | 0 |
| stackiq | SkRapportages | 4 | 0 |
| thematiq | TqBeweging | 4 | 0 |
| thematiq | TqContrastrapport | 6 | 0 |
| thematiq | TqEigenComponent | 4 | 0 |
| thematiq | TqEigenSets | 4 | 0 |
| thematiq | TqEigenTokens | 8 | 0 |
| thematiq | TqLettertypen | 4 | 0 |
| thematiq | TqLogboek | 7 | 0 |
| thematiq | TqMerkenKiezen | 4 | 0 |
| thematiq | TqOmgevingsmarkering | 3 | 0 |
| thematiq | TqSetUploaden | 6 | 0 |
| thematiq | TqTokenToevoegen | 8 | 0 |
| thematiq | TqTokenUitfaseren | 8 | 0 |
| thematiq | TqVersieHerstellen | 7 | 0 |
| thematiq | TqWissels | 4 | 0 |
| vaartveld | Contentpagina | 7 | 0 |
| vaartveld | Detail | 6 | 0 |
| vaartveld | Editor | 4 | 0 |
| vaartveld | LqDetail | 2 | 0 |
| vaartveld | LqRolC | 6 | 0 |
| vaartveld | Main | 3 | 0 |
| vaartveld | Nodig | 5 | 0 |
| versioniq | VqAutomatischeUpdates | 6 | 0 |
| versioniq | VqBronnen | 4 | 0 |
| versioniq | VqInstellingen | 4 | 0 |
| versioniq | VqTokens | 6 | 0 |
| warmtepompacademie | Contentpagina | 6 | 0 |
| warmtepompacademie | Documenten | 5 | 0 |
| warmtepompacademie | LqRolB | 5 | 0 |
| warmtepompacademie | LqRolC | 5 | 0 |
| warmtepompacademie | Main | 3 | 0 |
| warmtepompacademie | Nodig | 6 | 0 |
| werkplek | Geavanceerd | 3 | 0 |
| werkplek | Tabs | 3 | 0 |
| wilgenboom | Contentpagina | 3 | 0 |
| wilgenboom | Editor | 5 | 0 |
| wilgenboom | Main | 3 | 0 |
| wilgenboom | MijnLijst | 6 | 0 |
| wilgenboom | Nodig | 5 | 0 |
